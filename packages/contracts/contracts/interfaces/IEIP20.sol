pragma solidity ^0.4.19;

import 'IEIP20Basic.sol';

contract IEIP20 is IEIP20Basic {
    
    bytes4 constant INTERFACE_ID =
        IEIP20Basic.INTERFACE_ID ^
        bytes4(keccak256('allowance(address,address)')) ^
        bytes4(keccak256('approve(address,uint256)')) ^
        bytes4(keccak256('transferFrom(address,address,uint256)'));
    
    function IEIP20()
        public
    {
        supportsInterface[INTERFACE_ID] = true;
    }
    
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value);
    
    function transferFrom(address from, address to, uint256 value)
        public
        returns (bool success);
    
    function approve(address spender, uint256 value)
        public
        returns (bool success);
    
    function allowance(address owner, address spender)
        public view
        returns (uint256 remaining);
}
