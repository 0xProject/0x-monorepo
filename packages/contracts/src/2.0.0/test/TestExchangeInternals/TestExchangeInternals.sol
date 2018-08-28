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

pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "../../protocol/Exchange/Exchange.sol";


// solhint-disable no-empty-blocks
contract TestExchangeInternals is
    Exchange
{
    constructor ()
        public
        Exchange("")
    {}

    /// @dev Adds properties of both FillResults instances.
    ///      Modifies the first FillResults instance specified.
    ///      Note that this function has been modified from the original
    //       internal version to return the FillResults.
    /// @param totalFillResults Fill results instance that will be added onto.
    /// @param singleFillResults Fill results instance that will be added to totalFillResults.
    /// @return newTotalFillResults The result of adding singleFillResults to totalFilResults.
    function publicAddFillResults(FillResults memory totalFillResults, FillResults memory singleFillResults)
        public
        pure
        returns (FillResults memory)
    {
        addFillResults(totalFillResults, singleFillResults);
        return totalFillResults;
    }

    /// @dev Calculates amounts filled and fees paid by maker and taker.
    /// @param order to be filled.
    /// @param takerAssetFilledAmount Amount of takerAsset that will be filled.
    /// @return fillResults Amounts filled and fees paid by maker and taker.
    function publicCalculateFillResults(
        Order memory order,
        uint256 takerAssetFilledAmount
    )
        public
        pure
        returns (FillResults memory fillResults)
    {
        return calculateFillResults(order, takerAssetFilledAmount);
    }

    /// @dev Calculates partial value given a numerator and denominator.
    ///      Reverts if rounding error is >= 0.1%
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target.
    function publicSafeGetPartialAmountFloor(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        public
        pure
        returns (uint256 partialAmount)
    {
        return safeGetPartialAmountFloor(numerator, denominator, target);
    }

    /// @dev Calculates partial value given a numerator and denominator.
    ///      Reverts if rounding error is >= 0.1%
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target.
    function publicSafeGetPartialAmountCeil(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        public
        pure
        returns (uint256 partialAmount)
    {
        return safeGetPartialAmountCeil(numerator, denominator, target);
    }

    /// @dev Calculates partial value given a numerator and denominator.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target.
    function publicGetPartialAmountFloor(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        public
        pure
        returns (uint256 partialAmount)
    {
        return getPartialAmountFloor(numerator, denominator, target);
    }

    /// @dev Calculates partial value given a numerator and denominator.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target.
    function publicGetPartialAmountCeil(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        public
        pure
        returns (uint256 partialAmount)
    {
        return getPartialAmountCeil(numerator, denominator, target);
    }

    /// @dev Checks if rounding error >= 0.1%.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to multiply with numerator/denominator.
    /// @return Rounding error is present.
    function publicIsRoundingErrorFloor(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        public
        pure
        returns (bool isError)
    {
        return isRoundingErrorFloor(numerator, denominator, target);
    }

    /// @dev Checks if rounding error >= 0.1%.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to multiply with numerator/denominator.
    /// @return Rounding error is present.
    function publicIsRoundingErrorCeil(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        public
        pure
        returns (bool isError)
    {
        return isRoundingErrorCeil(numerator, denominator, target);
    }
 
    /// @dev Updates state with results of a fill order.
    /// @param order that was filled.
    /// @param takerAddress Address of taker who filled the order.
    /// @param orderTakerAssetFilledAmount Amount of order already filled.
    /// @return fillResults Amounts filled and fees paid by maker and taker.
    function publicUpdateFilledState(
        Order memory order,
        address takerAddress,
        bytes32 orderHash,
        uint256 orderTakerAssetFilledAmount,
        FillResults memory fillResults
    )
        public
    {
        updateFilledState(
            order,
            takerAddress,
            orderHash,
            orderTakerAssetFilledAmount,
            fillResults
        );
    }
}
