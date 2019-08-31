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


library LibSafeMath {

    uint256 constant internal MAX_UINT_96 = 79228162514264337593543950335; // 2**96-1

    uint256 constant internal MAX_UINT_64 = 18446744073709551615; // 2**64-1

    /// @dev Returns the addition of two unsigned integers, reverting on overflow.
    /// Note that this reverts on overflow.
    function _add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "OVERFLOW");
        return c;
    }

    /// @dev Returns the subtraction of two unsigned integers.
    /// Note that this reverts on underflow.
    function _sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "UNDEROVERFLOW");
        uint256 c = a - b;

        return c;
    }

    /// @dev Returns the multiplication of two unsigned integers, reverting on overflow.
    /// Note that this reverts on overflow.
    function _mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /// @dev Returns the integer division of two unsigned integers.
    /// Note that this reverts on division by zero. The result is rounded towards zero.
    function _div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "DIVISION_BY_ZERO");
        uint256 c = a / b;
        return c;
    }

    /// @dev Safely downcasts to a uint96
    /// Note that this reverts if the input value is too large.
    function _downcastToUint96(uint256 a)
        internal
        pure
        returns (uint96)
    {
        require(
            a <= MAX_UINT_96,
            "VALUE_TOO_LARGE_TO_DOWNCAST_TO_UINT96"
        );
        return uint96(a);
    }

    /// @dev Safely downcasts to a uint64
    /// Note that this reverts if the input value is too large.
    function _downcastToUint64(uint256 a)
        internal
        pure
        returns (uint64)
    {
        require(
            a <= MAX_UINT_64,
            "VALUE_TOO_LARGE_TO_DOWNCAST_TO_UINT64"
        );
        return uint64(a);
    }

    /// @dev Safely adds two fractions `n_1/d_1 + n_2/d_2`
    /// @param n_1 numerator of `1`
    /// @param d_1 denominator of `1`
    /// @param n_2 numerator of `2`
    /// @param d_2 denominator of `2`
    /// @return numerator of sum
    /// @return denominator of sum
    function _addFractions(
        uint256 n_1,
        uint256 d_1,
        uint256 n_2,
        uint256 d_2
    )
        internal
        pure
        returns (
            uint256 numerator,
            uint256 denominator
        )
    {
        numerator = _add(
            _mul(n_1, d_2),
            _mul(n_2, d_1)
        );
        denominator = _mul(d_1, d_2);
        return (numerator, denominator);
    }

    /// @dev Safely scales the difference two fractions.
    /// @param n_1 numerator of `1`
    /// @param d_1 denominator of `1`
    /// @param n_2 numerator of `2`
    /// @param d_2 denominator of `2`
    /// @param s scalar to multiply by difference.
    /// @return result = `s * (n_1/d_1 - n_2/d_2)`.
    function _scaleFractionalDifference(
        uint256 n_1,
        uint256 d_1,
        uint256 n_2,
        uint256 d_2,
        uint256 s
    )
        internal
        pure
        returns (uint256)
    {
        uint256 numerator = _sub(
            _mul(n_1, d_2),
            _mul(n_2, d_1)
        );
        uint256 tmp = _div(numerator, d_2);
        uint256 result = _div(
            _mul(s, tmp),
            d_1
        );
        return result;
    }


}
