pragma solidity ^0.5.5;


interface IStakingEvents {

    /// @dev Emitted by MixinStake when new Stake is minted.
    /// @param owner of Stake.
    /// @param amount of Stake minted.
    event StakeMinted(
        address owner,
        uint256 amount
    );

    /// @dev Emitted by MixinStake when Stake is burned.
    /// @param owner of Stake.
    /// @param amount of Stake burned.
    event StakeBurned(
        address owner,
        uint256 amount
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
        uint64 epoch,
        uint64 startTimeInSeconds,
        uint64 earliestEndTimeInSeconds
    );

     /// @dev Emitted by MixinScheduler when the timelock period is changed.
     /// @param timelockPeriod The timelock period we changed to.
     /// @param startEpoch The epoch this period started.
     /// @param endEpoch The epoch this period ends.
    event TimelockPeriodChanged(
        uint64 timelockPeriod,
        uint64 startEpoch,
        uint64 endEpoch
    );

    /// @dev Emitted by `MixinExchangeFees` when all active pools have been finalized.
    /// @param epoch The epoch that was finalized.
    /// @param rewardsPaid The total rewards paid to active pools.
    /// @param rewardsRemaining The rewards left after paying active pools.
    event EpochFinalized(
        uint256 indexed epoch,
        uint256 rewardsPaid,
        uint256 rewardsRemaining
    );

    /// @dev Emitted by MixinExchangeFees the first time protocol fees are
    ///      first credited to a staking pool in an epoch.
    /// @param epoch The epoch the pool was activated in.
    /// @param poolId The pool ID.
    event StakingPoolActivated(
        uint256 indexed epoch,
        bytes32 indexed poolId
    );

    /// @dev Emitted by MixinExchangeFees when a pool's rewards are paid out.
    /// @param poolId The pool ID.
    /// @param epoch The epoch for which the rewards came from.
    /// @param rewards Rewards paid to the pool.
    /// @param weightedStake Weighted stake of the pool at the end of the epoch.
    /// @param feesCollected Fees collected by the pool at the end of the epoch.
    event RewardDeposited(
        bytes32 indexed poolId,
        uint256 indexed epoch,
        uint256 rewards,
        uint256 weightedStake,
        uint256 feesCollected
    );

    /// @dev Emitted by MixinOwnable when the contract's ownership changes
    /// @param newOwner New owner of the contract
    event OwnershipTransferred(
        address newOwner
    );

    /// @dev Emitted by MixinStakingPool when a new pool is created.
    /// @param poolId Unique id generated for pool.
    /// @param operatorAddress Address of creator/operator of pool.
    /// @param operatorShare The share of rewards given to the operator, denominated
    ///                      in 1 / `TOKEN_MULTIPLIER`.
    event StakingPoolCreated(
        bytes32 poolId,
        address operatorAddress,
        uint256 operatorShare
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
