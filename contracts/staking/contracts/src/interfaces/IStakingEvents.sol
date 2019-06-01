

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
}