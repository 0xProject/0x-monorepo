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

import "../../../utils/SafeMath/SafeMath.sol";

contract LibMath is
    SafeMath
{
    string constant ROUNDING_ERROR_ON_PARTIAL_AMOUNT = "A rounding error occurred when calculating partial transfer amounts.";

    /// @dev Calculates partial value given a numerator and denominator.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target.
    function getPartialAmount(
        uint256 numerator,
        uint256 denominator,
        uint256 target)
        internal
        pure
        returns (uint256 partialAmount)
    {
        partialAmount = safeDiv(
            safeMul(numerator, target),
            denominator
        );
        return partialAmount;
    }

    /// @dev Calculates partial value given a numerator and denominator.
    ///      Throws if there is a rounding error.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target.
    function safeGetPartialAmount(
        uint256 numerator,
        uint256 denominator,
        uint256 target)
        internal pure
        returns (uint256 partialAmount)
    {
        require(
            !isRoundingError(numerator, denominator, target),
            ROUNDING_ERROR_ON_PARTIAL_AMOUNT
        );
        return getPartialAmount(numerator, denominator, target);
    }

    /// @dev Checks if rounding error > 0.1%.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to multiply with numerator/denominator.
    /// @return Rounding error is present.
    function isRoundingError(
        uint256 numerator,
        uint256 denominator,
        uint256 target)
        internal
        pure
        returns (bool isError)
    {
        uint256 remainder = mulmod(target, numerator, denominator);
        if (remainder == 0) {
            return false; // No rounding error.
        }

        uint256 errPercentageTimes1000000 = safeDiv(
            safeMul(remainder, 1000000),
            safeMul(numerator, target)
        );
        isError = errPercentageTimes1000000 > 1000;
        return isError;
    }
}
