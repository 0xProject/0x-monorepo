pragma solidity ^0.5.9;


contract IResolver {

    function addr(bytes32 node)
        external
        view
        returns (address);
}
