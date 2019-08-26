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


library LibSafeMath64 {

    /// @dev Returns the addition of two unsigned integers, reverting on overflow.
    /// Note that this reverts on overflow.
    function safeAdd(uint64 a, uint64 b) internal pure returns (uint64) {
        uint64 c = a + b;
        if (c < a) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.Uint64BinOpError(
                LibSafeMathRichErrors.BinOpErrorCodes.ADDITION_OVERFLOW,
                a,
                b
            ));
        }

        return c;
    }

    /// @dev Returns the subtraction of two unsigned integers.
    /// Note that this reverts on underflow.
    function safeSub(uint64 a, uint64 b) internal pure returns (uint64) {
        if (b > a) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.Uint64BinOpError(
                LibSafeMathRichErrors.BinOpErrorCodes.SUBTRACTION_UNDERFLOW,
                a,
                b
            ));
        }

        uint64 c = a - b;
        return c;
    }

    /// @dev Returns the multiplication of two unsigned integers, reverting on overflow.
    /// Note that this reverts on overflow.
    function safeMul(uint64 a, uint64 b) internal pure returns (uint64) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint64 c = a * b;
        if (c / a != b) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.Uint64BinOpError(
                LibSafeMathRichErrors.BinOpErrorCodes.MULTIPLICATION_OVERFLOW,
                a,
                b
            ));
        }

        return c;
    }

    /// @dev Returns the integer division of two unsigned integers.
    /// Note that this reverts on division by zero. The result is rounded towards zero.
    function safeDiv(uint64 a, uint64 b) internal pure returns (uint64) {
        if (b == 0) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.Uint64BinOpError(
                LibSafeMathRichErrors.BinOpErrorCodes.DIVISION_BY_ZERO,
                a,
                b
            ));
        }

        uint64 c = a / b;
        return c;
    }
}
