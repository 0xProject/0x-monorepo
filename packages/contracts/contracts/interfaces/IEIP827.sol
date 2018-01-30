pragma solidity ^0.4.19;

import 'IEIP20.sol';

contract IEIP827 is IEIP20 {
    
    bytes4 constant INTERFACE_ID =
        IEIP20.INTERFACE_ID ^
        bytes4(keccak256('transfer(address,uint256,bytes)')) ^
        bytes4(keccak256('approve(address,uint256,bytes)')) ^
        bytes4(keccak256('transferFrom(address,address,uint256,bytes)'));
    
    function IEIP827()
        public
    {
        supportsInterface[INTERFACE_ID] = true;
    }
    
    function transfer(address to, uint256 value, bytes data)
        public
        returns (bool success);
    
    function transferFrom(address from, address to, uint256 value, bytes data)
        public
        returns (bool success);
    
    function approve(address spender, uint256 value, bytes data)
        public
        returns (bool success);
}
