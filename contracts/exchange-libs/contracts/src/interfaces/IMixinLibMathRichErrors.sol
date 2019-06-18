pragma solidity ^0.5.9;


contract IMixinLibMathRichErrors {

    // bytes4(keccak256("DivisionByZeroError()"))
    bytes4 internal constant DIVISION_BY_ZERO_SELECTOR =
        0xa791837c;

    // bytes4(keccak256("RoundingError(uint256,uint256,uint256)"))
    bytes4 internal constant ROUNDING_ERROR_SELECTOR =
        0x339f3de2;
}
