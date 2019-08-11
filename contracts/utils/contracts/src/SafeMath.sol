pragma solidity ^0.5.9;

import "./LibRichErrors.sol";
import "./LibSafeMathRichErrors.sol";


contract SafeMath {

    function _safeMul(uint256 a, uint256 b)
        internal
        pure
        returns (uint256)
    {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        if (c / a != b) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.SafeMathError(
                LibSafeMathRichErrors.SafeMathErrorCodes.UINT256_MULTIPLICATION_OVERFLOW,
                a,
                b
            ));
        }
        return c;
    }

    function _safeDiv(uint256 a, uint256 b)
        internal
        pure
        returns (uint256)
    {
        if (b == 0) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.SafeMathError(
                LibSafeMathRichErrors.SafeMathErrorCodes.UINT256_DIVISION_BY_ZERO,
                a,
                b
            ));
        }
        uint256 c = a / b;
        return c;
    }

    function _safeSub(uint256 a, uint256 b)
        internal
        pure
        returns (uint256)
    {
        if (b > a) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.SafeMathError(
                LibSafeMathRichErrors.SafeMathErrorCodes.UINT256_SUBTRACTION_UNDERFLOW,
                a,
                b
            ));
        }
        return a - b;
    }

    function _safeAdd(uint256 a, uint256 b)
        internal
        pure
        returns (uint256)
    {
        uint256 c = a + b;
        if (c < a) {
            LibRichErrors.rrevert(LibSafeMathRichErrors.SafeMathError(
                LibSafeMathRichErrors.SafeMathErrorCodes.UINT256_ADDITION_OVERFLOW,
                a,
                b
            ));
        }
        return c;
    }

    function _max256(uint256 a, uint256 b)
        internal
        pure
        returns (uint256)
    {
        return a >= b ? a : b;
    }

    function _min256(uint256 a, uint256 b)
        internal
        pure
        returns (uint256)
    {
        return a < b ? a : b;
    }
}
