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

pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "./mixins/MixinBalancer.sol";
import "./mixins/MixinCurve.sol";
import "./mixins/MixinEth2Dai.sol";
import "./mixins/MixinKyber.sol";
import "./mixins/MixinUniswap.sol";
import "./mixins/MixinUniswapV2.sol";
import "./mixins/MixinZeroExBridge.sol";

contract BridgeAdapter is
    MixinBalancer,
    MixinCurve,
    MixinEth2Dai,
    MixinKyber,
    MixinUniswap,
    MixinUniswapV2,
    MixinZeroExBridge
{

    address private constant BALANCER_BRIDGE_ADDRESS = 0xfe01821Ca163844203220cd08E4f2B2FB43aE4E4;
    address private constant CURVE_BRIDGE_ADDRESS = 0x1796Cd592d19E3bcd744fbB025BB61A6D8cb2c09;
    address private constant ETH2DAI_BRIDGE_ADDRESS = 0x991C745401d5b5e469B8c3e2cb02C748f08754f1;
    address private constant KYBER_BRIDGE_ADDRESS = 0x1c29670F7a77f1052d30813A0a4f632C78A02610;
    address private constant UNISWAP_BRIDGE_ADDRESS = 0x36691C4F426Eb8F42f150ebdE43069A31cB080AD;
    address private constant UNISWAP_V2_BRIDGE_ADDRESS = 0xDcD6011f4C6B80e470D9487f5871a0Cba7C93f48;

    /// @dev Emitted when a trade occurs.
    /// @param inputToken The token the bridge is converting from.
    /// @param outputToken The token the bridge is converting to.
    /// @param inputTokenAmount Amount of input token.
    /// @param outputTokenAmount Amount of output token.
    /// @param from The bridge address, indicating the underlying source of the fill.
    /// @param to The `to` address, currrently `address(this)`
    event ERC20BridgeTransfer(
        address inputToken,
        address outputToken,
        uint256 inputTokenAmount,
        uint256 outputTokenAmount,
        address from,
        address to
    );

    function trade(
        bytes calldata makerAssetData,
        address fromTokenAddress,
        uint256 sellAmount
    )
        external
        returns (uint256 boughtAmount)
    {
        (
            address toTokenAddress,
            address bridgeAddress,
            bytes memory bridgeData
        ) = abi.decode(
            makerAssetData[4:],
            (address, address, bytes)
        );
        require(bridgeAddress != address(this), "INVALID_BRIDGE_ADDRESS");

        if (bridgeAddress == CURVE_BRIDGE_ADDRESS) {
            boughtAmount = _tradeCurve(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == UNISWAP_V2_BRIDGE_ADDRESS) {
            boughtAmount = _tradeUniswapV2(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == UNISWAP_BRIDGE_ADDRESS) {
            boughtAmount = _tradeUniswap(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == BALANCER_BRIDGE_ADDRESS) {
            boughtAmount = _tradeBalancer(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == KYBER_BRIDGE_ADDRESS) {
            boughtAmount = _tradeKyber(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == ETH2DAI_BRIDGE_ADDRESS) {
            boughtAmount = _tradeEth2Dai(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else {
            boughtAmount = _tradeZeroExBridge(
                bridgeAddress,
                fromTokenAddress,
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        }

        emit ERC20BridgeTransfer(
            fromTokenAddress,
            toTokenAddress,
            sellAmount,
            boughtAmount,
            bridgeAddress,
            address(this)
        );

        return boughtAmount;
    }
}
