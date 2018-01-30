pragma solidity ^0.4.19;

import 'IEIP20Basic.sol';
import 'IEIP20Optional.sol';

contract IEIP223 is IEIP20Basic, IEIP20Optional {
    
    bytes4 constant INTERFACE_ID =
        IEIP20Basic.INTERFACE_ID ^
        IEIP20Optional.INTERFACE_ID ^
        bytes4(keccak256('transfer(address,uint256,bytes)'));
    
    function IEIP223()
        public
    {
        supportsInterface[INTERFACE_ID] = true;
    }
    
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed value,
        bytes data);
    
    function transfer(address to, uint value, bytes data)
        public
        returns (bool);
}
