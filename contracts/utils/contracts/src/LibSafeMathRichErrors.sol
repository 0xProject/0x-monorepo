pragma solidity ^0.5.9;


library LibSafeMathRichErrors {

    // bytes4(keccak256("Uint256BinopError(uint8,uint256,uint256)"))
    bytes4 internal constant UINT256_BINOP_ERROR_SELECTOR =
        0x8d8e1919;

    // bytes4(keccak256("Uint96BinopError(uint8,uint96,uint96)"))
    bytes4 internal constant UINT96_BINOP_ERROR_SELECTOR =
        0x224cf712;

    // bytes4(keccak256("Uint64BinopError(uint8,uint64,uint64)"))
    bytes4 internal constant UINT64_BINOP_ERROR_SELECTOR =
        0x4e79032d;

    // bytes4(keccak256("Uint256DowncastError(uint8,uint256)"))
    bytes4 internal constant UINT256_DOWNCAST_ERROR_SELECTOR =
        0xc996af7b;

    enum BinopErrorCodes {
        ADDITION_OVERFLOW,
        MULTIPLICATION_OVERFLOW,
        SUBTRACTION_UNDERFLOW,
        DIVISION_BY_ZERO
    }

    enum DowncastErrorCodes {
        VALUE_TOO_LARGE_TO_DOWNCAST_TO_UINT64,
        VALUE_TOO_LARGE_TO_DOWNCAST_TO_UINT96
    }

    // solhint-disable func-name-mixedcase
    function Uint256BinopError(
        BinopErrorCodes errorCode,
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            UINT256_BINOP_ERROR_SELECTOR,
            errorCode,
            a,
            b
        );
    }

    function Uint96BinopError(
        BinopErrorCodes errorCode,
        uint96 a,
        uint96 b
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            UINT96_BINOP_ERROR_SELECTOR,
            errorCode,
            a,
            b
        );
    }

    function Uint64BinopError(
        BinopErrorCodes errorCode,
        uint64 a,
        uint64 b
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            UINT64_BINOP_ERROR_SELECTOR,
            errorCode,
            a,
            b
        );
    }

    function Uint256DowncastError(
        DowncastErrorCodes errorCode,
        uint256 a
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            UINT256_DOWNCAST_ERROR_SELECTOR,
            errorCode,
            a
        );
    }
}
