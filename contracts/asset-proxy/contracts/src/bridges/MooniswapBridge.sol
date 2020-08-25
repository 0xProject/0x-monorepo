/*

  Copyright 2020 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-exchange-libs/contracts/src/IWallet.sol";
import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "../interfaces/IERC20Bridge.sol";
import "../interfaces/IMooniswap.sol";


// solhint-disable space-after-comma
// solhint-disable not-rely-on-time
contract MooniswapBridge is
    IERC20Bridge,
    IWallet,
    DeploymentConstants
{

    struct TransferState {
        IMooniswap pool;
        uint256 fromTokenBalance;
        IEtherToken weth;
        uint256 boughtAmount;
        address fromTokenAddress;
        address toTokenAddress;
    }

    // solhint-disable no-empty-blocks
    /// @dev Payable fallback to receive ETH from uniswap.
    function ()
        external
        payable
    {}

    /// @dev Callback for `IERC20Bridge`. Tries to buy `amount` of
    ///      `toTokenAddress` tokens by selling the entirety of the `fromTokenAddress`
    ///      token encoded in the bridge data.
    /// @param toTokenAddress The token to buy and transfer to `to`.
    /// @param from The maker (this contract).
    /// @param to The recipient of the bought tokens.
    /// @param amount Minimum amount of `toTokenAddress` tokens to buy.
    /// @param bridgeData The abi-encoded path of token addresses. Last element must be toTokenAddress
    /// @return success The magic bytes if successful.
    function bridgeTransferFrom(
        address toTokenAddress,
        address from,
        address to,
        uint256 amount,
        bytes calldata bridgeData
    )
        external
        returns (bytes4 success)
    {
        // State memory object to avoid stack overflows.
        TransferState memory state;
        // Decode the bridge data to get the `fromTokenAddress`.
        address fromTokenAddress = abi.decode(bridgeData, (address));
        // Get the weth contract.
        state.weth = IEtherToken(_getWethAddress());
        // Get our balance of `fromTokenAddress` token.
        state.fromTokenBalance = IERC20Token(fromTokenAddress).balanceOf(address(this));

        state.fromTokenAddress = fromTokenAddress == address(state.weth) ? address(0) : fromTokenAddress;
        state.toTokenAddress = toTokenAddress == address(state.weth) ? address(0) : toTokenAddress;
        state.pool = IMooniswap(
            IMooniswapRegistry(_getMooniswapAddress()).pools(
                state.fromTokenAddress,
                state.toTokenAddress
            )
        );

        // withdraw WETH to ETH
        if (state.fromTokenAddress == address(0)) {
            state.weth.withdraw(state.fromTokenBalance);
        } else {
            // Grant the pool an allowance.
            LibERC20Token.approveIfBelow(
                state.fromTokenAddress,
                address(state.pool),
                state.fromTokenBalance
            );
        }
        uint256 ethValue = state.fromTokenAddress == address(0) ? state.fromTokenBalance : 0;
        state.boughtAmount = state.pool.swap.value(ethValue)(
            state.fromTokenAddress,
            state.toTokenAddress,
            state.fromTokenBalance,
            amount,
            address(0)
        );
        // Deposit to WETH
        if (state.toTokenAddress == address(0)) {
            state.weth.deposit.value(state.boughtAmount)();
        }

        // Transfer funds to `to`
        LibERC20Token.transfer(toTokenAddress, to, state.boughtAmount);

        emit ERC20BridgeTransfer(
            // input token
            fromTokenAddress,
            // output token
            toTokenAddress,
            // input token amount
            state.fromTokenBalance,
            // output token amount
            state.boughtAmount,
            from,
            to
        );

        return BRIDGE_SUCCESS;
    }

    /// @dev `SignatureType.Wallet` callback, so that this bridge can be the maker
    ///      and sign for itself in orders. Always succeeds.
    /// @return magicValue Success bytes, always.
    function isValidSignature(
        bytes32,
        bytes calldata
    )
        external
        view
        returns (bytes4 magicValue)
    {
        return LEGACY_WALLET_MAGIC_VALUE;
    }
}
