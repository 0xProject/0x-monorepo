pragma solidity ^0.5.9;


contract IOwnable {

    /// @dev Emitted by Ownable when ownership is transferred.
    /// @param newOwner The new owner of the contract.
    event OwnershipTransferred(address newOwner);

    /// @dev Transfers ownership of the contract to a new address.
    /// @param newOwner The address that will become the owner.
    function transferOwnership(address newOwner)
        public;
}
