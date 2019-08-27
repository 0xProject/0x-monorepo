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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMathRichErrors.sol";


library LibSafeMath {

    uint256 constant internal MAX_UINT_96 = 79228162514264337593543950335; // 2**96-1
    uint256 constant internal MAX_UINT_64 = 18446744073709551615; // 2**64-1

    /// @dev Returns the addition of two unsigned integers, reverting on overflow.
    /// Note that this reverts on overflow.
    function _add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        if (c < a) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.Uint256BinOpError(
                LibSafeMathRichErrors.BinOpErrorCodes.ADDITION_OVERFLOW,
                a,
                b
            ));
        }

        return c;
    }

    /// @dev Returns the subtraction of two unsigned integers.
    /// Note that this reverts on underflow.
    function _sub(uint256 a, uint256 b) internal pure returns (uint256) {
        if (b > a) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.Uint256BinOpError(
                LibSafeMathRichErrors.BinOpErrorCodes.SUBTRACTION_UNDERFLOW,
                a,
                b
            ));
        }

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
        if (c / a != b) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.Uint256BinOpError(
                LibSafeMathRichErrors.BinOpErrorCodes.MULTIPLICATION_OVERFLOW,
                a,
                b
            ));
        }

        return c;
    }

    /// @dev Returns the integer division of two unsigned integers.
    /// Note that this reverts on division by zero. The result is rounded towards zero.
    function _div(uint256 a, uint256 b) internal pure returns (uint256) {
        if (b == 0) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.Uint256BinOpError(
                LibSafeMathRichErrors.BinOpErrorCodes.DIVISION_BY_ZERO,
                a,
                b
            ));
        }

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
        if (a > MAX_UINT_96) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.Uint256DowncastError(
                LibSafeMathRichErrors.DowncastErrorCodes.VALUE_TOO_LARGE_TO_DOWNCAST_TO_UINT96,
                a
            ));
        }
        return uint96(a);
    }

    /// @dev Safely downcasts to a uint64
    /// Note that this reverts if the input value is too large.
    function _downcastToUint64(uint256 a)
        internal
        pure
        returns (uint64)
    {
        if (a > MAX_UINT_64) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.Uint256DowncastError(
                LibSafeMathRichErrors.DowncastErrorCodes.VALUE_TOO_LARGE_TO_DOWNCAST_TO_UINT64,
                a
            ));
        }
        return uint64(a);
    }
}
