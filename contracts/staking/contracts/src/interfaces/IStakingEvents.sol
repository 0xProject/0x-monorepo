pragma solidity ^0.5.5;


interface IStakingEvents {
    
    event StakeMinted(
        address owner,
        uint256 amount
    );

    event StakeBurned(
        address owner,
        uint256 amount
    );

    event PoolCreated(
        bytes32 poolId,
        address operatorAddress,
        uint8 operatorShare
    );

    event ExchangeAdded(
        address exchangeAddress
    );

    event ExchangeRemoved(
        address exchangeAddress
    );

    event EpochFinalized(
        uint256 totalActivePools,
        uint256 totalFees,
        uint256 totalRewards
    );
}