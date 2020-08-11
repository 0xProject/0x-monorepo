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

import "@0x/contracts-erc20/contracts/src/v06/LibERC20TokenV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";
import "@0x/contracts-utils/contracts/src/v06/LibSafeMathV06.sol";
import "./mixins/MixinBalancer.sol";
import "./mixins/MixinCurve.sol";
import "./mixins/MixinEth2Dai.sol";
import "./mixins/MixinKyber.sol";
import "./mixins/MixinUniswap.sol";
import "./mixins/MixinUniswapV2.sol";

/*
    0x Bridge
*/
interface IERC20Bridge {

    /// @dev Transfers `amount` of the ERC20 `tokenAddress` from `from` to `to`.
    /// @param tokenAddress The address of the ERC20 token to transfer.
    /// @param from Address to transfer asset from.
    /// @param to Address to transfer asset to.
    /// @param amount Amount of asset to transfer.
    /// @param bridgeData Arbitrary asset data needed by the bridge contract.
    /// @return success The magic bytes `0xdc1600f3` if successful.
    function bridgeTransferFrom(
        address tokenAddress,
        address from,
        address to,
        uint256 amount,
        bytes calldata bridgeData
    )
        external
        returns (bytes4 success);
}


contract BridgeAdapter is
    MixinBalancer,
    MixinCurve,
    MixinEth2Dai,
    MixinKyber,
    MixinUniswap,
    MixinUniswapV2
{
    using LibERC20TokenV06 for IERC20TokenV06;
    using LibSafeMathV06 for uint256;

    // solhint-disable
    /// @dev Allows this contract to receive ether.
    receive() external payable {}
    // solhint-enable

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
        // toTokenAddress is stored in the makerAssetData
        if (bridgeAddress == 0x1796Cd592d19E3bcd744fbB025BB61A6D8cb2c09) {
            // CurveBridge
            boughtAmount = _tradeCurve(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == 0x36691C4F426Eb8F42f150ebdE43069A31cB080AD) {
            // Uniswap bridge
            boughtAmount = _tradeUniswap(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == 0xDcD6011f4C6B80e470D9487f5871a0Cba7C93f48) {
            // Uniswap v2
            boughtAmount = _tradeUniswapV2(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == 0xfe01821Ca163844203220cd08E4f2B2FB43aE4E4) {
            // Balancer
            boughtAmount = _tradeBalancer(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == 0x1c29670F7a77f1052d30813A0a4f632C78A02610) {
            // Kyber
            boughtAmount = _tradeKyber(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == 0x991C745401d5b5e469B8c3e2cb02C748f08754f1) {
            // Eth2Dai
            boughtAmount = _tradeEth2Dai(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else {
            uint256 balanceBefore = IERC20TokenV06(toTokenAddress).compatBalanceOf(address(this));
            // Trade the good old fashioned way
            IERC20TokenV06(fromTokenAddress).compatTransfer(
                bridgeAddress,
                sellAmount
            );
            IERC20Bridge(bridgeAddress).bridgeTransferFrom(
                toTokenAddress,
                bridgeAddress,
                address(this),
                1, // amount to transfer back from the bridge
                bridgeData
            );
            boughtAmount = IERC20TokenV06(toTokenAddress).compatBalanceOf(address(this)).safeSub(balanceBefore);
        }
        // TODO event, maybe idk
        return boughtAmount;
    }
}
