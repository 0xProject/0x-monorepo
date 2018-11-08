pragma solidity ^0.4.24;

contract MultipleReturnValues {
    function methodWithMultipleReturnValues() public pure returns(int, int) {
        return (0, 0);
    }
}
