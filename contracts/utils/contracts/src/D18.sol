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

pragma solidity ^0.5.16;


/// @dev A library for working with 18 digit, base 10 decimals.
library D18 {

    /// @dev Decimal places for dydx value quantities.
    uint256 private constant PRECISION = 18;
    /// @dev 1.0 in base-18 decimal.
    int256 private constant DECIMAL_ONE = int256(10 ** PRECISION);
    /// @dev Minimum signed integer value.
    int256 private constant MIN_INT256_VALUE = int256(0x8000000000000000000000000000000000000000000000000000000000000000);

    /// @dev Return `1.0`
    function one()
        internal
        pure
        returns (int256 r)
    {
        r = DECIMAL_ONE;
    }

    /// @dev Add two decimals.
    function add(int256 a, int256 b)
        internal
        pure
        returns (int256 r)
    {
        r = _add(a, b);
    }

    /// @dev Add two decimals.
    function add(uint256 a, int256 b)
        internal
        pure
        returns (int256 r)
    {
        require(int256(a) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        r = _add(int256(a), b);
    }

    /// @dev Add two decimals.
    function add(int256 a, uint256 b)
        internal
        pure
        returns (int256 r)
    {
        require(int256(b) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        r = _add(a, int256(b));
    }

    /// @dev Add two decimals.
    function add(uint256 a, uint256 b)
        internal
        pure
        returns (int256 r)
    {
        require(int256(a) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        require(int256(b) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        r = _add(int256(a), int256(b));
    }

    /// @dev Subract two decimals.
    function sub(int256 a, int256 b)
        internal
        pure
        returns (int256 r)
    {
        r = _add(a, -b);
    }

    /// @dev Subract two decimals.
    function sub(uint256 a, int256 b)
        internal
        pure
        returns (int256 r)
    {
        require(int256(a) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        r = _add(int256(a), -b);
    }

    /// @dev Subract two decimals.
    function sub(uint256 a, uint256 b)
        internal
        pure
        returns (int256 r)
    {
        require(int256(a) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        require(int256(b) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        r = _add(int256(a), -int256(b));
    }

    /// @dev Multiply two decimals.
    function mul(int256 a, int256 b)
        internal
        pure
        returns (int256 r)
    {
        r = _div(_mul(a, b), DECIMAL_ONE);
    }

    /// @dev Multiply two decimals.
    function mul(uint256 a, int256 b)
        internal
        pure
        returns (int256 r)
    {
        require(int256(a) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        r = _div(_mul(int256(a), b), DECIMAL_ONE);
    }

    /// @dev Multiply two decimals.
    function mul(int256 a, uint256 b)
        internal
        pure
        returns (int256 r)
    {
        require(int256(b) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        r = _div(_mul(a, int256(b)), DECIMAL_ONE);
    }

    /// @dev Multiply two decimals.
    function mul(uint256 a, uint256 b)
        internal
        pure
        returns (int256 r)
    {
        require(int256(a) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        require(int256(b) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        r = _div(_mul(int256(a), int256(b)), DECIMAL_ONE);
    }

    /// @dev Divide two decimals.
    function div(int256 a, int256 b)
        internal
        pure
        returns (int256 r)
    {
        r = _div(_mul(a, DECIMAL_ONE), b);
    }

    /// @dev Divide two decimals.
    function div(uint256 a, int256 b)
        internal
        pure
        returns (int256 r)
    {
        require(int256(a) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        r = _div(_mul(int256(a), DECIMAL_ONE), b);
    }

    /// @dev Divide two decimals.
    function div(int256 a, uint256 b)
        internal
        pure
        returns (int256 r)
    {
        require(int256(b) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        r = _div(_mul(a, DECIMAL_ONE), int256(b));
    }

    /// @dev Divide two decimals.
    function div(uint256 a, uint256 b)
        internal
        pure
        returns (int256 r)
    {
        require(int256(a) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        require(int256(b) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        r = _div(_mul(int256(a), DECIMAL_ONE), int256(b));
    }

    /// @dev Safely convert an unsigned integer into a signed integer.
    function toSigned(uint256 a)
        internal
        pure
        returns (int256 r)
    {
        require(int256(a) >= 0, "D18/DECIMAL_VALUE_TOO_BIG");
        r = int256(a);
    }

    /// @dev Clip a signed value to be positive.
    function clip(int256 a)
        internal
        pure
        returns (int256 r)
    {
        r = a < 0 ? 0 : a;
    }

    /// @dev Safely multiply two signed integers.
    function _mul(int256 a, int256 b)
        private
        pure
        returns (int256 r)
    {
        if (a == 0 || b == 0) {
            return 0;
        }
        r = a * b;
        require(r / a == b && r / b == a, "D18/DECIMAL_MUL_OVERFLOW");
        return r;
    }

    /// @dev Safely divide two signed integers.
    function _div(int256 a, int256 b)
        private
        pure
        returns (int256 r)
    {
        require(b != 0, "D18/DECIMAL_DIV_BY_ZERO");
        require(a != MIN_INT256_VALUE || b != -1, "D18/DECIMAL_DIV_OVERFLOW");
        r = a / b;
    }

    /// @dev Safely add two signed integers.
    function _add(int256 a, int256 b)
        private
        pure
        returns (int256 r)
    {
        r = a + b;
        require(
            !((a < 0 && b < 0 && r > a) || (a > 0 && b > 0 && r < a)),
            "D18/DECIMAL_ADD_OVERFLOW"
        );
    }

}
