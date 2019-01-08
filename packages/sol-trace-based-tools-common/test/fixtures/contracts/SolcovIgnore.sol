pragma solidity ^0.4.21;

contract SolcovIgnore {
    uint public storedData;

    function set(uint x) public {
        /* solcov ignore next */
        storedData = x;
    }

    /* solcov ignore next */
    function get() constant public returns (uint retVal) {
        return storedData;
    }
}

/* solcov ignore next */
contract Ignore {
    function ignored() public returns (bool) {
        return false;
    }
}
