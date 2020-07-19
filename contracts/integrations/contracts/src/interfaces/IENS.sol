pragma solidity ^0.5.9;

import "./IResolver.sol";


contract IENS {

    function resolver(bytes32 node) 
        external
        view
        returns (IResolver);
}
