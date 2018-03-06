pragma solidity ^0.4.19;

import './IEIP165.sol';

contract IEIP165Cache is IEIP165 {
    
    bytes4 INTERFACE_ID = 
        bytes4(keccak256('query(address,bytes4)')) ^
        bytes4(keccak256('query(address,bytes4[])'));

    function IEIP165Cache()
        public
    {
        supportsInterface[INTERFACE_ID] = true;
    }
    
    enum Status {
        Unknown,
        Unsupported,
        Supported
    }
    
    /// When EIP165 support is queried, the result will never be Unknown.
    /// If EIP165 is supported, no result will ever be Unknown.
    /// If EIP165 is unsupported, other results may be unknown (but may
    /// be manually set). 
    /// @returns Status.Unknown if support could not be determined
    /// @returns Status.Unsupported if 
    function query(address addr, bytes4 interfaceId)
        public
        returns (Status);
    
    /// Batch query multiple interfaces. Corresponding output
    /// bit is set to one iff it has Status.Supported.
    function query(address addr, bytes4[] interfaceIds)
        public
        returns (uint256 r);
}
