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

pragma solidity ^0.5.5;


contract LibMath {

    /// @dev Calculates partial value given a numerator and denominator rounded down.
    ///      Reverts if rounding error is >= 0.1%
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target rounded down.
    function _safeGetPartialAmountFloor(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        internal
        pure
        returns (uint256 partialAmount)
    {
        require(
            denominator > 0,
            "DIVISION_BY_ZERO"
        );

        require(
            !_isRoundingErrorFloor(
                numerator,
                denominator,
                target
            ),
            "ROUNDING_ERROR"
        );
        
        partialAmount = (numerator * target) / denominator;
        return partialAmount;
    }

    /// @dev Calculates partial value given a numerator and denominator rounded down.
    ///      Reverts if rounding error is >= 0.1%
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target rounded up.
    function _safeGetPartialAmountCeil(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        internal
        pure
        returns (uint256 partialAmount)
    {
        require(
            denominator > 0,
            "DIVISION_BY_ZERO"
        );

        require(
            !_isRoundingErrorCeil(
                numerator,
                denominator,
                target
            ),
            "ROUNDING_ERROR"
        );
        
        // _safeDiv computes `floor(a / b)`. We use the identity (a, b integer):
        //       ceil(a / b) = floor((a + b - 1) / b)
        // To implement `ceil(a / b)` using _safeDiv.
        partialAmount = ((numerator * target) + (denominator - 1)) / denominator;
        return partialAmount;
    }

    /// @dev Calculates partial value given a numerator and denominator rounded down.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target rounded down.
    function _getPartialAmountFloor(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        internal
        pure
        returns (uint256 partialAmount)
    {
        require(
            denominator > 0,
            "DIVISION_BY_ZERO"
        );

        partialAmount = (numerator * target) / denominator;
        return partialAmount;
    }
    
    /// @dev Calculates partial value given a numerator and denominator rounded down.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target rounded up.
    function _getPartialAmountCeil(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        internal
        pure
        returns (uint256 partialAmount)
    {
        require(
            denominator > 0,
            "DIVISION_BY_ZERO"
        );

        // _safeDiv computes `floor(a / b)`. We use the identity (a, b integer):
        //       ceil(a / b) = floor((a + b - 1) / b)
        // To implement `ceil(a / b)` using _safeDiv.
        partialAmount = ((numerator * target) + (denominator - 1)) / denominator;
        return partialAmount;
    }
    
    /// @dev Checks if rounding error >= 0.1% when rounding down.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to multiply with numerator/denominator.
    /// @return Rounding error is present.
    function _isRoundingErrorFloor(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        internal
        pure
        returns (bool isError)
    {
        require(
            denominator > 0,
            "DIVISION_BY_ZERO"
        );
        
        // The absolute rounding error is the difference between the rounded
        // value and the ideal value. The relative rounding error is the
        // absolute rounding error divided by the absolute value of the
        // ideal value. This is undefined when the ideal value is zero.
        //
        // The ideal value is `numerator * target / denominator`.
        // Let's call `numerator * target % denominator` the remainder.
        // The absolute error is `remainder / denominator`.
        //
        // When the ideal value is zero, we require the absolute error to
        // be zero. Fortunately, this is always the case. The ideal value is
        // zero iff `numerator == 0` and/or `target == 0`. In this case the
        // remainder and absolute error are also zero. 
        if (target == 0 || numerator == 0) {
            return false;
        }
        
        // Otherwise, we want the relative rounding error to be strictly
        // less than 0.1%.
        // The relative error is `remainder / (numerator * target)`.
        // We want the relative error less than 1 / 1000:
        //        remainder / (numerator * denominator)  <  1 / 1000
        // or equivalently:
        //        1000 * remainder  <  numerator * target
        // so we have a rounding error iff:
        //        1000 * remainder  >=  numerator * target
        uint256 remainder = mulmod(
            target,
            numerator,
            denominator
        );
        isError = 1000 * remainder >= numerator * target;
        return isError;
    }
    
    /// @dev Checks if rounding error >= 0.1% when rounding up.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to multiply with numerator/denominator.
    /// @return Rounding error is present.
    function _isRoundingErrorCeil(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        internal
        pure
        returns (bool isError)
    {
        require(
            denominator > 0,
            "DIVISION_BY_ZERO"
        );
        
        // See the comments in `isRoundingError`.
        if (target == 0 || numerator == 0) {
            // When either is zero, the ideal value and rounded value are zero
            // and there is no rounding error. (Although the relative error
            // is undefined.)
            return false;
        }
        // Compute remainder as before
        uint256 remainder = mulmod(
            target,
            numerator,
            denominator
        );
        remainder = (denominator - remainder) % denominator;
        isError = 1000 * remainder >= numerator * target;
        return isError;
    }

    /// @dev Returns the minimum of two provided uint256 values
    function _min256(uint256 a, uint256 b)
        internal
        pure
        returns (uint256)
    {
        return a < b ? a : b;
    }
}
