pragma solidity ^0.5.9;

import "@0x/contracts-utils/contracts/src/Ownable.sol";
import "../interfaces/IStakingEvents.sol";
import "../immutable/MixinStorage.sol";


contract MixinOwnable is
    Ownable,
    IStakingEvents,
    MixinDeploymentConstants,
    MixinConstants,
    MixinStorage
{
    
    /// @dev This mixin contains logic for ownable contracts.
    /// Note that unlike the standardized `ownable` contract,
    /// there is no state declared here. It is instead located
    /// in `immutable/MixinStorage.sol` and its value is set
    /// by the delegating proxy (StakingProxy.sol)
    constructor() public {}
}
