pragma solidity ^0.4.19;

contract IEIP165 {
    
    bytes4 constant public INVALID_ID = 0xFFFFFFFF;

    bytes4 constant INTERFACE_ID =
        bytes4(keccak256('supportsInterface(bytes4)'));
    
    mapping(bytes4 => bool) public supportsInterface;
    
    function IEIP165()
        public
    {
        supportsInterface[INTERFACE_ID] = true;
    }
    
    function supportsInterface(bytes4 interfaceId)
        public view 
        returns (bool)
    {
        return supportsInterface[interfaceId];
    }
}
