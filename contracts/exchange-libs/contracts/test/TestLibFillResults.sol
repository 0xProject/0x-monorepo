/*

  Copyright 2018 ZeroEx Intl.

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

import "../src/LibOrder.sol";
import "../src/LibFillResults.sol";


contract TestLibFillResults {

    function calculateFillResults(
        LibOrder.Order memory order,
        uint256 takerAssetFilledAmount
    )
        public
        pure
        returns (LibFillResults.FillResults memory fillResults)
    {
        fillResults = LibFillResults.calculateFillResults(order, takerAssetFilledAmount);
        return fillResults;
    }

    function calculateMatchedFillResults(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        uint256 leftOrderTakerAssetFilledAmount,
        uint256 rightOrderTakerAssetFilledAmount,
        bool shouldMaximallyFillOrders
    )
        public
        pure
        returns (LibFillResults.MatchedFillResults memory matchedFillResults)
    {
        matchedFillResults = LibFillResults.calculateMatchedFillResults(
            leftOrder,
            rightOrder,
            leftOrderTakerAssetFilledAmount,
            rightOrderTakerAssetFilledAmount,
            shouldMaximallyFillOrders
        );
        return matchedFillResults;
    }

    function addFillResults(
        LibFillResults.FillResults memory fillResults1,
        LibFillResults.FillResults memory fillResults2
    )
        public
        pure
        returns (LibFillResults.FillResults memory totalFillResults)
    {
        totalFillResults = LibFillResults.addFillResults(fillResults1, fillResults2);
        return totalFillResults;
    }
}
