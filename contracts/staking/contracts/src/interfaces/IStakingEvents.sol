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

    /// @dev Emitted by MixinExchangeFees when a pool pays protocol fees
    ///      for the first time in an epoch.
    /// @param epoch The epoch in which the pool was activated.
    /// @param poolId The ID of the pool.
    event StakingPoolActivated(
        uint256 indexed epoch,
        bytes32 indexed poolId
    );

    /// @dev Emitted by MixinFinalizer when an epoch has ended.
    /// @param epoch The closing epoch.
    /// @param numActivePools Number of active pools in the closing epoch.
    /// @param rewardsAvailable Rewards available to all active pools.
    /// @param totalWeightedStake Total weighted stake across all active pools.
    /// @param totalFeesCollected Total fees collected across all active pools.
    event EpochEnded(
        uint256 indexed epoch,
        uint256 numActivePools,
        uint256 rewardsAvailable,
        uint256 totalFeesCollected,
        uint256 totalWeightedStake
    );

    /// @dev Emitted by MixinFinalizer when an epoch is fully finalized.
    /// @param epoch The epoch being finalized.
    /// @param rewardsPaid Total amount of rewards paid out.
    /// @param rewardsRemaining Rewards left over.
    event EpochFinalized(
        uint256 indexed epoch,
        uint256 rewardsPaid,
        uint256 rewardsRemaining
    );

    /// @dev Emitted by MixinFinalizer when rewards are paid out to a pool.
    /// @param epoch The epoch when the rewards were earned.
    /// @param poolId The pool's ID.
    /// @param operatorReward Amount of reward paid to pool operator.
    /// @param membersReward Amount of reward paid to pool members.
    event RewardsPaid(
        uint256 indexed epoch,
        bytes32 indexed poolId,
        uint256 operatorReward,
        uint256 membersReward
    );

    /// @dev Emitted whenever staking parameters are changed via the `setParams()` function.
    /// @param epochDurationInSeconds Minimum seconds between epochs.
    /// @param rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
    /// @param minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
    /// @param maximumMakersInPool Maximum number of maker addresses allowed to be registered to a pool.
    /// @param cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
    /// @param cobbDouglasAlphaDenominator Denominator for cobb douglas alpha factor.
    /// @param wethProxyAddress The address that can transfer WETH for fees.
    /// @param ethVaultAddress Address of the EthVault contract.
    /// @param rewardVaultAddress Address of the StakingPoolRewardVault contract.
    /// @param zrxVaultAddress Address of the ZrxVault contract.
    event ParamsSet(
        uint256 epochDurationInSeconds,
        uint32 rewardDelegatedStakeWeight,
        uint256 minimumPoolStake,
        uint256 maximumMakersInPool,
        uint256 cobbDouglasAlphaNumerator,
        uint256 cobbDouglasAlphaDenominator,
        address wethProxyAddress,
        address ethVaultAddress,
        address rewardVaultAddress,
        address zrxVaultAddress
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

    /// @dev Emitted by MixinStakingPool when a new pool is created.
    /// @param poolId Unique id generated for pool.
    /// @param operator The operator (creator) of pool.
    /// @param operatorShare The share of rewards given to the operator, in ppm.
    event StakingPoolCreated(
        bytes32 poolId,
        address operator,
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

    /// @dev Emitted when a staking pool's operator share is decreased.
    /// @param poolId Unique Id of pool.
    /// @param oldOperatorShare Previous share of rewards owned by operator.
    /// @param newOperatorShare Newly decreased share of rewards owned by operator.
    event OperatorShareDecreased(
        bytes32 indexed poolId,
        uint32 oldOperatorShare,
        uint32 newOperatorShare
    );
}
