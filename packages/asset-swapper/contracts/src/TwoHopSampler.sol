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

pragma solidity ^0.6;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/v06/LibBytesV06.sol";


contract TwoHopSampler {
    using LibBytesV06 for bytes;

    struct HopInfo {
        uint256 sourceIndex;
        bytes returnData;
    }

    function sampleTwoHopSell(
        bytes[] memory firstHopCalls,
        bytes[] memory secondHopCalls,
        uint256 sellAmount
    )
        public
        view
        returns (
            HopInfo memory firstHop,
            HopInfo memory secondHop,
            uint256 buyAmount
        )
    {
        uint256 intermediateAssetAmount = 0;
        for (uint256 i = 0; i != firstHopCalls.length; ++i) {
            firstHopCalls[i].writeUint256(firstHopCalls[i].length - 32, sellAmount);
            (bool didSucceed, bytes memory returnData) = address(this).staticcall(firstHopCalls[i]);
            if (didSucceed) {
                uint256 amount = returnData.readUint256(returnData.length - 32);
                if (amount > intermediateAssetAmount) {
                    intermediateAssetAmount = amount;
                    firstHop.sourceIndex = i;
                    firstHop.returnData = returnData;
                }
            }
        }
        if (intermediateAssetAmount == 0) {
            return (firstHop, secondHop, buyAmount);
        }
        for (uint256 j = 0; j != secondHopCalls.length; ++j) {
            secondHopCalls[j].writeUint256(secondHopCalls[j].length - 32, intermediateAssetAmount);
            (bool didSucceed, bytes memory returnData) = address(this).staticcall(secondHopCalls[j]);
            if (didSucceed) {
                uint256 amount = returnData.readUint256(returnData.length - 32);
                if (amount > buyAmount) {
                    buyAmount = amount;
                    secondHop.sourceIndex = j;
                    secondHop.returnData = returnData;
                }
            }
        }
    }

    function sampleTwoHopBuy(
        bytes[] memory firstHopCalls,
        bytes[] memory secondHopCalls,
        uint256 buyAmount
    )
        public
        view
        returns (
            HopInfo memory firstHop,
            HopInfo memory secondHop,
            uint256 sellAmount
        )
    {
        sellAmount = uint256(-1);
        uint256 intermediateAssetAmount = uint256(-1);
        for (uint256 j = 0; j != secondHopCalls.length; ++j) {
            secondHopCalls[j].writeUint256(secondHopCalls[j].length - 32, buyAmount);
            (bool didSucceed, bytes memory returnData) = address(this).staticcall(secondHopCalls[j]);
            if (didSucceed) {
                uint256 amount = returnData.readUint256(returnData.length - 32);
                if (
                    amount > 0 &&
                    amount < intermediateAssetAmount
                ) {
                    intermediateAssetAmount = amount;
                    secondHop.sourceIndex = j;
                    secondHop.returnData = returnData;
                }
            }
        }
        if (intermediateAssetAmount == uint256(-1)) {
            return (firstHop, secondHop, sellAmount);
        }
        for (uint256 i = 0; i != firstHopCalls.length; ++i) {
            firstHopCalls[i].writeUint256(firstHopCalls[i].length - 32, intermediateAssetAmount);
            (bool didSucceed, bytes memory returnData) = address(this).staticcall(firstHopCalls[i]);
            if (didSucceed) {
                uint256 amount = returnData.readUint256(returnData.length - 32);
                if (
                    amount > 0 &&
                    amount < sellAmount
                ) {
                    sellAmount = amount;
                    firstHop.sourceIndex = i;
                    firstHop.returnData = returnData;
                }
            }
        }
    }
}
