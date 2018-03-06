pragma solidity ^0.4.19;

import './IEIP165.sol';

contract IEIP20Basic is IEIP165 {
    
    bytes4 constant INTERFACE_ID =
        bytes4(keccak256('totalSupply()')) ^
        bytes4(keccak256('balanceOf(address)')) ^
        bytes4(keccak256('transfer(address,uint256)'));
    
    function IEIP20Basic()
        public
    {
        supportsInterface[INTERFACE_ID] = true;
    }
    
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 value);
    
    function totalSupply()
        public view
        returns (uint256);
    
    function balanceOf()
        public view
        returns (uint256);
    
    function transfer(address to, uint256 value)
        public
        returns (bool success);
}
