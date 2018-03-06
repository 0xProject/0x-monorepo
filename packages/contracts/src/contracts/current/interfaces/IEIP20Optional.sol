pragma solidity ^0.4.19;

import './IEIP165.sol';

contract IEIP20Optional is IEIP165 {
    
    bytes4 constant INTERFACE_ID =
        bytes4(keccak256('name()')) ^
        bytes4(keccak256('symbol()')) ^
        bytes4(keccak256('decimals()'));
    
    function IEIP20Optional()
        public
    {
        supportsInterface[INTERFACE_ID] = true;
    }
    
    function name()
        public view
        returns (string);
    
    function symbol()
        public view
        returns (string);
    
    function decimals()
        public view
        returns (uint256);
}
