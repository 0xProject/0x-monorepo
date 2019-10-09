pragma solidity ^0.5.9;


contract TestFramework {

    event SomeEvent(uint256 someNumber);

    uint256 public counter;

    function setCounter(uint256 newCounter)
        external
    {
        counter = newCounter;
    }

    function revertSideEffect(uint256 returnValue)
        external
        returns (uint256)
    {
        if (counter != 0) {
            revert("Revert");
        }

        emit SomeEvent(returnValue);
        return returnValue;
    }

    function equalsSideEffect(uint256 possiblyZero)
        external
        view
        returns (bool)
    {
        if (counter == 0) {
            return possiblyZero == 0;
        } else {
            return false;
        }
    }

    function noEffect(uint256)
        external
        pure
    {} // solhint-disable-line no-empty-blocks

    function numberSideEffect()
        external
        view
        returns (uint256)
    {
        return counter;
    }

    function hashSideEffect(uint256 arg1, bytes32 arg2)
        external
        view
        returns (bytes32)
    {
        if (counter == 0) {
            return keccak256(abi.encode(arg1, arg2));
        } else {
            return keccak256(hex"");
        }
    }
}
