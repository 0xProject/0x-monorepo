

interface IStakingEvents {
    
    event StakeMinted(
        address owner,
        uint256 amount
    );

    event StakeBurned(
        address owner,
        uint256 amount
    );
}