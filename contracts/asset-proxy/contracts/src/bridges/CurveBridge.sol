
/*

  Copyright 2019 ZeroEx Intl.

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
import "../interfaces/ICurve.sol";


// solhint-disable not-rely-on-time
// solhint-disable space-after-comma
contract CurveBridge is
    IERC20Bridge,
    IWallet,
    DeploymentConstants
{
    /// @dev Callback for `ICurve`. Tries to buy `amount` of
    ///      `toTokenAddress` tokens by selling the entirety of the opposing asset
    ///      (DAI, USDC) to the Curve contract, then transfers the bought
    ///      tokens to `to`.
    /// @param toTokenAddress The token to give to `to` (i.e DAI, USDC, USDT).
    /// @param to The recipient of the bought tokens.
    /// @param amount Minimum amount of `toTokenAddress` tokens to buy.
    /// @param bridgeData The abi-encoeded "from" token address.
    /// @return success The magic bytes if successful.
    function bridgeTransferFrom(
        address toTokenAddress,
        address /* from */,
        address to,
        uint256 amount,
        bytes calldata bridgeData
    )
        external
        returns (bytes4 success)
    {
        // Decode the bridge data to get the Curve metadata.
        (address curveAddress, int128 fromCoinIdx, int128 toCoinIdx, int128 version) = abi.decode(bridgeData, (address, int128, int128, int128));
        ICurve exchange = ICurve(curveAddress);

        address fromTokenAddress = exchange.underlying_coins(fromCoinIdx);
        require(toTokenAddress != fromTokenAddress, "CurveBridge/INVALID_PAIR");
        // Grant an allowance to the exchange to spend `fromTokenAddress` token.
        LibERC20Token.approve(fromTokenAddress, address(exchange), uint256(-1));

        // Try to sell all of this contract's `fromTokenAddress` token balance.
        if (version == 0) {
            exchange.exchange_underlying(
                fromCoinIdx,
                toCoinIdx,
                // dx
                IERC20Token(fromTokenAddress).balanceOf(address(this)),
                // min dy
                amount,
                // expires
                block.timestamp + 1
            );
        } else {
            exchange.exchange_underlying(
                fromCoinIdx,
                toCoinIdx,
                // dx
                IERC20Token(fromTokenAddress).balanceOf(address(this)),
                // min dy
                amount
            );
        }

        uint256 toTokenBalance = IERC20Token(toTokenAddress).balanceOf(address(this));
        // Transfer the converted `toToken`s to `to`.
        LibERC20Token.transfer(toTokenAddress, to, toTokenBalance);
        return BRIDGE_SUCCESS;
    }

    /// @dev `SignatureType.Wallet` callback, so that this bridge can be the maker
    ///      and sign for itself in orders. Always succeeds.
    /// @return magicValue Magic success bytes, always.
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
