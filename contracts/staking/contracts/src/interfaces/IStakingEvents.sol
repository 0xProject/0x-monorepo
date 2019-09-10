pragma solidity ^0.5.9;


interface IStakingEvents {

    /// @dev Emitted by MixinStake when ZRX is staked.
    /// @param owner of ZRX.
    /// @param amount of ZRX staked.
    event Stake(
        address indexed owner,
        uint256 amount
    );

    /// @dev Emitted by MixinStake when ZRX is unstaked.
    /// @param owner of ZRX.
    /// @param amount of ZRX unstaked.
    event Unstake(
        address indexed owner,
        uint256 amount
    );

    /// @dev Emitted by MixinStake when ZRX is unstaked.
    /// @param owner of ZRX.
    /// @param amount of ZRX unstaked.
    event MoveStake(
        address indexed owner,
        uint256 amount,
        uint8 fromStatus,
        bytes32 indexed fromPool,
        uint8 toStatus,
        bytes32 indexed toPool
    );

    /// @dev Emitted by MixinExchangeManager when an exchange is added.
    /// @param exchangeAddress Address of new exchange.
    event ExchangeAdded(
        address exchangeAddress
    );

    /// @dev Emitted by MixinExchangeManager when an exchange is removed.
    /// @param exchangeAddress Address of removed exchange.
    event ExchangeRemoved(
        address exchangeAddress
    );

    /// @dev Emitted by MixinScheduler when the epoch is changed.
    /// @param epoch The epoch we changed to.
    /// @param startTimeInSeconds The start time of the epoch.
    /// @param earliestEndTimeInSeconds The earliest this epoch can end.
    event EpochChanged(
        uint256 epoch,
        uint256 startTimeInSeconds,
        uint256 earliestEndTimeInSeconds
    );

    /// @dev Emitted whenever staking parameters are changed via the `setParams()` function.
    /// @param epochDurationInSeconds Minimum seconds between epochs.
    /// @param rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
    /// @param minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
    /// @param maximumMakersInPool Maximum number of maker addresses allowed to be registered to a pool.
    /// @param cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
    /// @param cobbDouglasAlphaDenomintor Denominator for cobb douglas alpha factor.
    event ParamsChanged(
        uint256 epochDurationInSeconds,
        uint32 rewardDelegatedStakeWeight,
        uint256 minimumPoolStake,
        uint256 maximumMakersInPool,
        uint256 cobbDouglasAlphaNumerator,
        uint256 cobbDouglasAlphaDenomintor
    );

     /// @dev Emitted by MixinScheduler when the timeLock period is changed.
     /// @param timeLockPeriod The timeLock period we changed to.
     /// @param startEpoch The epoch this period started.
     /// @param endEpoch The epoch this period ends.
    event TimeLockPeriodChanged(
        uint256 timeLockPeriod,
        uint256 startEpoch,
        uint256 endEpoch
    );

    /// @dev Emitted by MixinExchangeFees when rewards are paid out.
    /// @param totalActivePools Total active pools this epoch.
    /// @param totalFeesCollected Total fees collected this epoch, across all active pools.
    /// @param totalWeightedStake Total weighted stake attributed to each pool. Delegated stake is weighted less.
    /// @param totalRewardsPaid Total rewards paid out across all active pools.
    /// @param initialContractBalance Balance of this contract before paying rewards.
    /// @param finalContractBalance Balance of this contract after paying rewards.
    event RewardsPaid(
        uint256 totalActivePools,
        uint256 totalFeesCollected,
        uint256 totalWeightedStake,
        uint256 totalRewardsPaid,
        uint256 initialContractBalance,
        uint256 finalContractBalance
    );

    /// @dev Emitted by MixinStakingPool when a new pool is created.
    /// @param poolId Unique id generated for pool.
    /// @param operatorAddress Address of creator/operator of pool.
    /// @param operatorShare The share of rewards given to the operator, in ppm.
    event StakingPoolCreated(
        bytes32 poolId,
        address operatorAddress,
        uint32 operatorShare
    );

    /// @dev Emitted by MixinStakingPool when a new maker requests to join a pool.
    /// @param poolId Unique id of pool.
    /// @param makerAddress Adress of maker joining the pool.
    event PendingAddMakerToPool(
        bytes32 poolId,
        address makerAddress
    );

    /// @dev Emitted by MixinStakingPool when a new maker is added to a pool.
    /// @param poolId Unique id of pool.
    /// @param makerAddress Adress of maker added to pool.
    event MakerAddedToStakingPool(
        bytes32 poolId,
        address makerAddress
    );

    /// @dev Emitted by MixinStakingPool when a maker is removed from a pool.
    /// @param poolId Unique id of pool.
    /// @param makerAddress Adress of maker added to pool.
    event MakerRemovedFromStakingPool(
        bytes32 poolId,
        address makerAddress
    );

    /// @dev Emitted by MixinStakingPoolRewardVault when the vault's address is changed.
    /// @param rewardVaultAddress Address of new reward vault.
    event StakingPoolRewardVaultChanged(
        address rewardVaultAddress
    );
}
