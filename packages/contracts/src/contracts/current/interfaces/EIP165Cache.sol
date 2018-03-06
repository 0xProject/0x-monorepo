pragma solidity ^0.4.19;

import './IEIP165Cache.sol';
import '../utils/Ownable/Ownable.sol';

// Based on EIP165Cache from @jbaylina
// https://github.com/jbaylina/EIP165Cache/blob/master/contracts/EIP165Cache.sol
//
// Changes:
// * Optimizations
// * Allow cache refresh
// * Allow owner override

contract EIP165Cache is Ownable, IEIP165Cache {
    
    mapping (address => mapping (bytes4 => Status)) cache;
    
    mapping (address => mapping (bytes4 => Status)) overrides;
    
    function query(address addr, bytes4 interfaceId)
        public
        returns (Status)
    {
        Status status = cache[addr][interfaceId];
        if (status != Status.Unknown) {
            return status;
        }
        
        // Apply optional override
        status = overrides[addr][interfaceId];
        if (status != Status.Unknown) {
            cache[addr][interfaceId] = status;
            return status;
        }
        
        // Check for IEIP165 support
        Status eip165Status;
        eip165Status = cache[addr][IEIP165.INTERFACE_ID];
        if (eip165Status == Status.Unsupported) {
            // TODO: Do we want to cache this? (three lookups vs one?)
            // Note: The edge case where interfaceId == IEIP165.INTERFACE_ID is
            // covered by the first conditional.
            return Status.Unknown;
        }
        
        // Test for IEIP165 support
        if (eip165Status == Status.Unknown) {
            bool success1;
            bool success2;
            bool result1;
            bool result2;
            (success1, result1) = noThrowCall(addr, IEIP165.INTERFACE_ID);
            (success2, result2) = noThrowCall(addr, IEIP165.INVALID_ID);
            bool eip165Supported = success1 && success2 && result1 && !result2;
            eip165Status = eip165Supported ? Status.Supported : Status.Unsupported;
            cache[addr][IEIP165.INTERFACE_ID] = eip165Status;
        }
        
        // Test for interface support
        if (eip165Status == Status.Supported) {
            IEIP165 ieip165 = IEIP165(addr);
            bool supported = ieip165.supportsInterface(interfaceId);
            status = supported ? Status.Supported : Status.Unsupported;
            cache[addr][interfaceId] = status;
            return status;
        } else {
            // assert(eip165Status == Unsupported);
            return Status.Unknown;
        }
    }
    
    function query(address addr, bytes4[] interfaceIds)
        public
        returns (uint256 bitvector)
    {
        require(interfaceIds.length <= 256);
        bitvector = 0;
        for (int256 i = int256(interfaceIds.length) - 1; i >= 0; --i) {
            
            // Bit shift bitvector left one.
            bitvector += bitvector;
            
            // TODO Could cache contract IEIP165 support
            Status status = query(addr, interfaceIds[uint256(i)]);
            if (status == Status.Supported) {
                bitvector |= 1;
            }
        }
        return bitvector;
    }
    
    function refresh(address addr, bytes4 interfaceId)
        public
    {
        // Clear cache
        cache[addr][interfaceId] = Status.Unknown;
        
        // Force reload cache
        query(addr, interfaceId);
    }
    
    function override(address addr, bytes4 interfaceId, Status status)
        public
        onlyOwner()
    {
        overrides[addr][interfaceId] = status;
        refresh(addr, interfaceId);
    }

    function noThrowCall(address addr, bytes4 interfaceId)
        internal view
        returns (bool success, bool result)
    {
        // Function signature
        bytes4 sig = bytes4(keccak256("supportsInterface(bytes4)"));
        
        // We need assembly to capture call success
        assembly {
            
            // Store input calldata at free storage
            let free := mload(0x40)
            mstore(free, sig)
            mstore(add(free, 0x04), interfaceId)

            // Static call, storing `success` instead of reverting
            success := staticcall(
                30000, // Gas
                addr,  // To addr
                free,  // Inputs are stored at location x
                0x8,   // Inputs are 8 bytes long
                free,  // Store output over input (saves space)
                0x20   // Outputs are 32 bytes long
            )
            
            // Load the output returndata
            result := mload(free)
        }
    }
}
