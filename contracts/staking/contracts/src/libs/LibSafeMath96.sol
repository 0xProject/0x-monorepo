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


library LibSafeMath96 {

    /// @dev Returns the addition of two unsigned integers, reverting on overflow.
    /// Note that this reverts on overflow.
    function _add(uint96 a, uint96 b) internal pure returns (uint96) {
        uint96 c = a + b;
        require(c >= a, "OVERFLOW");
        return c;
    }

    /// @dev Returns the subtraction of two unsigned integers.
    /// Note that this reverts on underflow.
    function _sub(uint96 a, uint96 b) internal pure returns (uint96) {
        require(b <= a, "UNDEROVERFLOW");
        uint96 c = a - b;

        return c;
    }

    /// @dev Returns the multiplication of two unsigned integers, reverting on overflow.
    /// Note that this reverts on overflow.
    function _mul(uint96 a, uint96 b) internal pure returns (uint96) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint96 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /// @dev Returns the integer division of two unsigned integers.
    /// Note that this reverts on division by zero. The result is rounded towards zero.
    function _div(uint96 a, uint96 b) internal pure returns (uint96) {
        require(b > 0, "DIVISION_BY_ZERO");
        uint96 c = a / b;
        return c;
    }

    /// @dev Computes the percentage `numerator` is of `value`.
    /// @param value The whole amount.
    /// @param slice A slice of `value`.
    /// @return The percentage `slice` is of `value`
    function _computePercentageCeil(uint96 value, uint8 slice)
        internal
        pure
        returns (uint96)
    {
        uint96 scaledNumerator = _mul(value, slice);
        uint96 ceilScalar = uint96(99);
        uint96 denominator = uint96(100);
        return _div(
            _add(scaledNumerator, ceilScalar),
            denominator
        );
    }
}
