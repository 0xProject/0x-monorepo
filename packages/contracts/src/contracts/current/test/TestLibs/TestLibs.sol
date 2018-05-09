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

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../../protocol/Exchange/libs/LibMath.sol";
import "../../protocol/Exchange/libs/LibOrder.sol";
import "../../protocol/Exchange/libs/LibFillResults.sol";

contract TestLibs is 
    LibMath,
    LibOrder,
    LibFillResults
{
    function publicGetPartialAmount(
        uint256 numerator,
        uint256 denominator,
        uint256 target)
        public
        pure
        returns (uint256 partialAmount)
    {
        partialAmount = getPartialAmount(
            numerator,
            denominator,
            target
        );
        return partialAmount;
    }

    function publicIsRoundingError(
        uint256 numerator,
        uint256 denominator,
        uint256 target)
        public
        pure
        returns (bool isError)
    {
        isError = isRoundingError(
            numerator,
            denominator,
            target
        );
        return isError;
    }

    function publicGetOrderHash(Order memory order)
        public
        view
        returns (bytes32 orderHash)
    {
        orderHash = getOrderHash(order);
        return orderHash;
    }

    function getOrderSchemaHash()
        public
        view
        returns (bytes32)
    {
        return ORDER_SCHEMA_HASH;
    }

    function publicAddFillResults(FillResults memory totalFillResults, FillResults memory singleFillResults)
        public
        pure
        returns (FillResults memory)
    {
        addFillResults(totalFillResults, singleFillResults);
        return totalFillResults;
    }
}
