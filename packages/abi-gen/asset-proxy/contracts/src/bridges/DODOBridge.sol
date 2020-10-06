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
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-exchange-libs/contracts/src/IWallet.sol";
import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "../interfaces/IERC20Bridge.sol";


interface IDODOHelper {

    function querySellQuoteToken(address dodo, uint256 amount) external view returns (uint256);
}


interface IDODO {

    function sellBaseToken(uint256 amount, uint256 minReceiveQuote, bytes calldata data) external returns (uint256);

    function buyBaseToken(uint256 amount, uint256 maxPayQuote, bytes calldata data) external returns (uint256);

}


contract DODOBridge is
    IERC20Bridge,
    IWallet,
    DeploymentConstants
{

    struct TransferState {
        address fromTokenAddress;
        uint256 fromTokenBalance;
        address pool;
        bool isSellBase;
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
        TransferState memory state;
        // Decode the bridge data to get the `fromTokenAddress`.
        (state.fromTokenAddress, state.pool, state.isSellBase) = abi.decode(bridgeData, (address, address, bool));
        require(state.pool != address(0), "DODOBridge/InvalidPool");
        IDODO exchange = IDODO(state.pool);
        // Get our balance of `fromTokenAddress` token.
        state.fromTokenBalance = IERC20Token(state.fromTokenAddress).balanceOf(address(this));

        // Grant the pool an allowance.
        LibERC20Token.approveIfBelow(
            state.fromTokenAddress,
            address(exchange),
            state.fromTokenBalance
        );

        uint256 boughtAmount;
        if (state.isSellBase) {
            boughtAmount = exchange.sellBaseToken(
                // amount to sell
                state.fromTokenBalance,
                // min receive amount
                1,
                new bytes(0)
            );
        } else {
            // Need to re-calculate the sell quote amount into buyBase
            boughtAmount = IDODOHelper(_getDODOHelperAddress()).querySellQuoteToken(
                address(exchange),
                state.fromTokenBalance
            );
            exchange.buyBaseToken(
                // amount to buy
                boughtAmount,
                // max pay amount
                state.fromTokenBalance,
                new bytes(0)
            );
        }
        // Transfer funds to `to`
        IERC20Token(toTokenAddress).transfer(to, boughtAmount);


        emit ERC20BridgeTransfer(
            // input token
            state.fromTokenAddress,
            // output token
            toTokenAddress,
            // input token amount
            state.fromTokenBalance,
            // output token amount
            boughtAmount,
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
