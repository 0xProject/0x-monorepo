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

import "./IsolatedExchange.sol";


// solhint-disable no-empty-blocks
contract TestMatchOrders is
    IsolatedExchange
{
    function publicCalculateMatchedFillResults(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        uint256 leftMakerAssetAmountRemaining,
        uint256 leftTakerAssetAmountRemaining,
        uint256 rightMakerAssetAmountRemaining,
        uint256 rightTakerAssetAmountRemaining
    )
        public
        pure
        returns (MatchedFillResults memory fillResults)
    {
        _calculateMatchedFillResults(
            fillResults,
            leftOrder,
            rightOrder,
            leftMakerAssetAmountRemaining,
            leftTakerAssetAmountRemaining,
            rightMakerAssetAmountRemaining,
            rightTakerAssetAmountRemaining
        );
        return fillResults;
    }

    function externalCalculateCompleteFillBoth(
        uint256 leftMakerAssetAmountRemaining,
        uint256 leftTakerAssetAmountRemaining,
        uint256 rightMakerAssetAmountRemaining,
        uint256 rightTakerAssetAmountRemaining
    )
        external
        pure
        returns (MatchedFillResults memory fillResults)
    {
        _calculateCompleteFillBoth(
            fillResults,
            leftMakerAssetAmountRemaining,
            leftTakerAssetAmountRemaining,
            rightMakerAssetAmountRemaining,
            rightTakerAssetAmountRemaining
        );
        return fillResults;
    }

    function publicCalculateCompleteRightFill(
        LibOrder.Order memory leftOrder,
        uint256 rightMakerAssetAmountRemaining,
        uint256 rightTakerAssetAmountRemaining
    )
        public
        pure
        returns (MatchedFillResults memory fillResults)
    {
        _calculateCompleteRightFill(
            fillResults,
            leftOrder,
            rightMakerAssetAmountRemaining,
            rightTakerAssetAmountRemaining
        );
    }
}
