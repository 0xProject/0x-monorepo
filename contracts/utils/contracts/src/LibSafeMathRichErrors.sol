pragma solidity ^0.5.9;


library LibSafeMathRichErrors {

    // bytes4(keccak256("SafeMathError(uint8,uint256,uint256)"))
    bytes4 internal constant SAFE_MATH_ERROR =
        0x35a51a70;

    enum SafeMathErrorCodes {
        UINT256_ADDITION_OVERFLOW,
        UINT256_MULTIPLICATION_OVERFLOW,
        UINT256_SUBTRACTION_UNDERFLOW,
        UINT256_DIVISION_BY_ZERO
    }

    // solhint-disable func-name-mixedcase
    function SafeMathError(
        SafeMathErrorCodes errorCode,
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SAFE_MATH_ERROR,
            errorCode,
            a,
            b
        );
    }
}
