pragma solidity ^0.5.9;

import "../interfaces/IStakingEvents.sol";
import "../immutable/MixinStorage.sol";


contract MixinOwnable is
    IStakingEvents,
    MixinStorage
{

    /// @dev This mixin contains logic for ownable contracts.
    /// Note that unlike the standardized `ownable` contract,
    /// there is no state declared here. It is instead located
    /// in `immutable/MixinStorage.sol` and its value is set
    /// by the delegating proxy (StakingProxy.sol)

    /// @dev reverts if called by a sender other than the owner.
    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "NOT_OWNER"
        );
        _;
    }

    /// @dev Transfers the ownership of this contract
    /// @param newOwner New owner of contract
    function transferOwnership(address newOwner)
        external
        onlyOwner
    {
        require(
            newOwner != address(0),
            "CANNOT_SET_OWNEROT_ADDRESS_ZERO"
        );
        owner = newOwner;
        emit OwnershipTransferred(newOwner);
    }
}
