pragma solidity ^0.4.19;

import 'IEIP165.sol';

contract IEIP223Callback is IEIP165 {
    
    bytes4 constant INTERFACE_ID =
        bytes4(keccak256('tokenFallback(address,uint256,bytes)'));
    
    function IEIP223Callback()
        public
    {
        supportsInterface[INTERFACE_ID] = true;
    }
    
    function tokenFallback(address from, uint256 value, bytes data)
        public;
}
