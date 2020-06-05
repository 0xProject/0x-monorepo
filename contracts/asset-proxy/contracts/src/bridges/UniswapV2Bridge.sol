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
import "@0x/contracts-utils/contracts/src/LibAddressArray.sol";
import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "../interfaces/IUniswapV2Router01.sol";
import "../interfaces/IERC20Bridge.sol";


// solhint-disable space-after-comma
// solhint-disable not-rely-on-time
contract UniswapV2Bridge is
    IERC20Bridge,
    IWallet,
    DeploymentConstants
{
    struct TransferState {
        address[] path;
        uint256 fromTokenBalance;
    }

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
        // hold variables to get around stack depth limitations
        TransferState memory state;

        // Decode the bridge data to get the `fromTokenAddress`.
        // solhint-disable indent
        state.path = abi.decode(bridgeData, (address[]));
        // solhint-enable indent

        require(state.path.length >= 2, "UniswapV2Bridge/PATH_LENGTH_MUST_BE_AT_LEAST_TWO");
        require(state.path[state.path.length - 1] == toTokenAddress, "UniswapV2Bridge/LAST_ELEMENT_OF_PATH_MUST_MATCH_OUTPUT_TOKEN");

        // Just transfer the tokens if they're the same.
        if (state.path[0] == toTokenAddress) {
            LibERC20Token.transfer(state.path[0], to, amount);
            return BRIDGE_SUCCESS;
        }

        // Get our balance of `fromTokenAddress` token.
        state.fromTokenBalance = IERC20Token(state.path[0]).balanceOf(address(this));

        // Grant the Uniswap router an allowance.
        LibERC20Token.approveIfBelow(
            state.path[0],
            _getUniswapV2Router01Address(),
            state.fromTokenBalance
        );

        // Buy as much `toTokenAddress` token with `fromTokenAddress` token
        // and transfer it to `to`.
        IUniswapV2Router01 router = IUniswapV2Router01(_getUniswapV2Router01Address());
        uint[] memory amounts = router.swapExactTokensForTokens(
             // Sell all tokens we hold.
            state.fromTokenBalance,
             // Minimum buy amount.
            amount,
            // Convert `fromTokenAddress` to `toTokenAddress`.
            state.path,
            // Recipient is `to`.
            to,
            // Expires after this block.
            block.timestamp
        );

        emit ERC20BridgeTransfer(
            // input token
            state.path[0],
            // output token
            toTokenAddress,
            // input token amount
            state.fromTokenBalance,
            // output token amount
            amounts[amounts.length - 1],
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
