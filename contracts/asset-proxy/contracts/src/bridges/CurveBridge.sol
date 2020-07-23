
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
    struct CurveBridgeData {
        address curveAddress;
        bytes4 exchangeFunctionSelector;
        address fromTokenAddress;
        int128 fromCoinIdx;
        int128 toCoinIdx;
    }

    /// @dev Callback for `ICurve`. Tries to buy `amount` of
    ///      `toTokenAddress` tokens by selling the entirety of the opposing asset
    ///      (DAI, USDC) to the Curve contract, then transfers the bought
    ///      tokens to `to`.
    /// @param toTokenAddress The token to give to `to` (i.e DAI, USDC, USDT).
    /// @param from The maker (this contract).
    /// @param to The recipient of the bought tokens.
    /// @param amount Minimum amount of `toTokenAddress` tokens to buy.
    /// @param bridgeData The abi-encoeded "from" token address.
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
        // Decode the bridge data to get the Curve metadata.
        CurveBridgeData memory data = abi.decode(bridgeData, (CurveBridgeData));

        require(toTokenAddress != data.fromTokenAddress, "CurveBridge/INVALID_PAIR");
        uint256 fromTokenBalance = IERC20Token(data.fromTokenAddress).balanceOf(address(this));
        // Grant an allowance to the exchange to spend `fromTokenAddress` token.
        LibERC20Token.approveIfBelow(data.fromTokenAddress, data.curveAddress, fromTokenBalance);

        // Try to sell all of this contract's `fromTokenAddress` token balance.
        {
            (bool didSucceed, bytes memory resultData) =
                data.curveAddress.call(abi.encodeWithSelector(
                    data.exchangeFunctionSelector,
                    data.fromCoinIdx,
                    data.toCoinIdx,
                    // dx
                    fromTokenBalance,
                    // min dy
                    amount
                ));
            if (!didSucceed) {
                assembly { revert(add(resultData, 32), mload(resultData)) }
            }
        }

        uint256 toTokenBalance = IERC20Token(toTokenAddress).balanceOf(address(this));
        // Transfer the converted `toToken`s to `to`.
        LibERC20Token.transfer(toTokenAddress, to, toTokenBalance);

        emit ERC20BridgeTransfer(
            data.fromTokenAddress,
            toTokenAddress,
            fromTokenBalance,
            toTokenBalance,
            from,
            to
        );
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
