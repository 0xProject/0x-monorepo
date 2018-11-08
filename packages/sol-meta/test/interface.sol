pragma solidity ^0.4.24;


contract IOwnable {

    function transferOwnership(address newOwner)
        public;
}

contract Ownable is
    IOwnable
{
    address public owner;

    constructor ()
        public
    {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "ONLY_CONTRACT_OWNER"
        );
        _;
    }

    function transferOwnership(address newOwner)
        public
        onlyOwner
    {
        if (newOwner != address(0)) {
            owner = newOwner;
        }
    }
}


contract MAssetProxyDispatcher is Ownable {

    function dispatchTransferFrom(
        bytes memory assetData,
        address from,
        address to,
        uint256 amount
    )
        internal;
    
    
    function someFunction(uint256 a, uint256 b)
        internal
        returns (uint256, bytes);
}
