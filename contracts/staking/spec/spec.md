[1 Overview](#1-overview)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[1.1 Motivation](#11-motivation)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[1.2 Design Principles](#12-design-principles)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[1.3 Utility of Stake](#13-utility-of-stake)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[1.4 Staking Pools](#14-staking-pools)
<br>[2 Architecture](#2-architecture)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[2.1 Read-Only Mode](#21-read-only-mode)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[2.2 Catastrophic Failure Mode](#22-catastrophic-failure-mode)
<br>[3 Contract Migrations](#3-contract-migrations)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[3.1 Deploying the system](#31-deploying-the-system)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[3.2 Upgrading Staking Proxy](#32-upgrading-staking-proxy)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[3.3 Upgrading Staking Contract](#33-upgrading-staking-contract)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[3.4 Upgrading ZRX Vault](#34-upgrading-zrx-vault)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[3.5 Upgrading the WETH Asset Proxy](#35-upgrading-the-weth-asset-proxy)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[3.6 Handling upgrades to the ERC20 Proxy or ERC20 Asset Data](#36-handling-upgrades-to-the-erc20-proxy-or-erc20-asset-data)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[3.7 Setting Parameters](#37-setting-parameters)
<br>[4 Epochs & Scheduling](#4-epochs--scheduling)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[4.1 Ending One Epoch, and Starting a New One](#41-ending-one-epoch-and-starting-a-new-one)
<br>[5 Staking](#5-staking)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[5.1 Staking Pools](#51-staking-pools)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[5.2 Stake Status](#52-stake-status)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[5.3 Querying Stake](#53-querying-stake)
<br>[6 Liquidity Incentives](#6-liquidity-incentives)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[6.1 Market Making](#61-market-making)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[6.2 Paying Liquidity Rewards (Finalization)](#62-paying-liquidity-rewards-finalization)
<br>[7 Batch Calls](#7-batch-calls)
<br>[8 Staking Events](#8-staking-events)
<br>[9 Algorithms, Data Structures & Design Patterns](#9-algorithms-data-structures--design-patterns)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[9.1 Securing the Proxy Pattern](#91-securing-the-proxy-pattern)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[9.2 The Read-Only Proxy](#92-the-read-only-proxy)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[9.3 Tracking for Reward Balances for Pool Members](#93-tracking-for-reward-balances-for-pool-members)
<br>&nbsp;&nbsp;&nbsp;&nbsp;[9.4 Stake Management](#94-stake-management)

## 1 Overview

This spec outlines the design principles and constraints of the liquidity incentive mechanism, along with its architecture, implementation and usage.

### 1.1 Motivation

Staking aligns all market participants with the long-term mission and objectives of 0x. Specifically, it encourages user ownership among market makers by rewarding those who stake. Protocol fees redirect proceeds from arbitrage-driven gas auctions back to market makers.

### 1.2 Design Principles

The design should incentivize liquidity providers to invest in the long-term success of the protocol, while creating a level playing field across all types of assets and classes of market makers. The architecture aims to minimize overhead and cost, both in terms of gas and effort to participate.

### 1.3 Utility of Stake

Token holders stake their ZRX to unlock utility within the 0x ecosystem. This includes earning liquidity rewards through market making on the 0x protocol and participating in governance over the protocol.

### 1.4 Staking Pools

Staking pools can be created to leverage the weight of other stakers. For example, market makers earn liquidity rewards proportional to both their trade volume and amount of stake delegated to their pool. Delegators, in turn, can earn a portion of the pool's liquidity reward.

Staking pools can also be used to increase voting power. Delegators share a portion of their vote with the pool, amplifying the pool's impact in governance over 0x.

## 2 Architecture

The smart contract architecture is derived from the proxy pattern, which allows state to be retained across upgrades to the logic.

This system is composed of four deployed contracts:

|Contract|Description |
|--|--|
| Staking Contract | An upgradeable/stateless contract that implements staking logic |
|Staking Proxy|Stores staking state and delegates to the Staking Contract|
|ZRX Vault|Securely holds staked ZRX Tokens|
|Read-Only Proxy|Forces read-only calls to the Staking Contract|

The diagram below shows how these contracts connect to each other and the broader 0x ecosystem.

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/Staking%20Architecture%20-%20Basic.png" width="700" /></p>


### 2.1 Read-Only Mode

If a vulnerability is discovered in the staking contract, operations may be halted to conduct forensics:

1.  The 0x Exchange contract stops charging protocol fees.
2.  The staking contract is set to read-only mode.

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/Staking%20Architecture%20-%20Read-Only.png" width="700" /></p>

### 2.2 Catastrophic Failure Mode

In this worst-case scenario, state has been irreparably corrupted and the staking contracts must be redeployed. Users would re-stake under the new system, at will.

1. The ZRX vault is detached from the staking contract.
2. Users withdraw their funds from the ZRX vault directly.

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/Staking%20Architecture%20-%20Catastrophic%20Failure.png" width="700" /></p>

## 3 Contract Migrations

This section outlines steps for managing the system of smart contracts. Operations are atomically executed as a group.

### 3.1 Deploying the system

1. Deploy ZRX Vault.
2. Deploy Staking Contract (address of ZRX Vault is hardcoded in this contract).
3. Deploy Staking Proxy.
4. Deploy Read-Only Proxy.
5. Attach Staking Contract to Staking Proxy.

### 3.2 Upgrading Staking Proxy

1. Deploy new Staking Proxy.
2. Set Staking Proxy in ZRX Vault.
3. Set Staking Proxy in 0x Exchanges.

### 3.3 Upgrading Staking Contract

1. Deploy new Staking Contract.
2. Attach Staking Contract to Staking Proxy.

### 3.4 Upgrading ZRX Vault

The ZRX Vault address is hardcoded in the Staking Contract and should not be upgraded. If it does need to be changed, then set the current ZRX Vault into Catastrophic Failure mode (allowing users to withdraw their ZRX) and redeploy the entire system (seciond 3.1).

### 3.5 Upgrading the WETH Asset Proxy

The WETH Asset Proxy is hardcoded in the Staking Contract. Upgrading this contract would require users to adjust their allowances, but it is possible in extreme circumstances.

1. Deploy new WETH Asset Proxy.
2. Update WETH Asset Proxy constant in Staking Contract.
3. Deploy new Staking Contract (section 3.3)

### 3.6 Handling upgrades to the ERC20 Proxy or ERC20 Asset Data

The staking contracts share the Exchange's ERC20 proxy. It is possible this contract could get re-deployed for reasons outside of staking.

1. Update the ERC20 Asset Proxy in the ZRX Vault.
2. Update the ZRX Asset Data (if necessary) in the ZRX Vault.

### 3.7 Setting Parameters

Configurable parameters can be set or queried using the functions below.

```
/// @dev Set all configurable parameters at once.
/// @param _epochDurationInSeconds Minimum seconds between epochs.
/// @param _rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
/// @param _minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
/// @param _maximumMakersInPool Maximum number of maker addresses allowed to be registered to a pool.
/// @param _cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
/// @param _cobbDouglasAlphaDenominator Denominator for cobb douglas alpha factor.
function setParams(
    uint256 _epochDurationInSeconds,
    uint32 _rewardDelegatedStakeWeight,
    uint256 _minimumPoolStake,
    uint256 _maximumMakersInPool,
    uint32 _cobbDouglasAlphaNumerator,
    uint32 _cobbDouglasAlphaDenominator
) external;

/// @dev Retrieves all configurable parameter values.
/// @return _epochDurationInSeconds Minimum seconds between epochs.
/// @return _rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
/// @return _minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
/// @return _maximumMakersInPool Maximum number of maker addresses allowed to be registered to a pool.
/// @return _cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
/// @return _cobbDouglasAlphaDenominator Denominator for cobb douglas alpha factor.
function getParams()
    external
    view
    returns (
        uint256 _epochDurationInSeconds,
        uint32 _rewardDelegatedStakeWeight,
        uint256 _minimumPoolStake,
        uint256 _maximumMakersInPool,
        uint32 _cobbDouglasAlphaNumerator,
        uint32 _cobbDouglasAlphaDenominator
    );
```


## 4 Epochs & Scheduling

All processes in the system are segmented into nonoverlapping time intervals, called epochs. Epochs have a fixed minimum period (10 days at time of writing), which is configurable via [MixinParams](https://github.com/0xProject/0x-monorepo/blob/3.0/contracts/staking/contracts/src/sys/MixinParams.sol). Epochs serve as the basis for all other timeframes within the system, which provides a more stable and consistent scheduling metric than timestamps.

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/Epochs.png" width="700" /></p>

### 4.1 Ending One Epoch, and Starting a New One

A new epoch automatically begins when the current epoch ends. Anyone can "end" an epoch by calling the staking contract after the minimum epoch period has elapsed.

```
function endEpoch()
    external
    returns (uint256 poolsRemaining);
```

Note: The return value (`poolsRemaining`) is described in detail in Section 7 Liquidity Rewards.


## 5 Staking

ZRX is staked by depositing tokens into the Staking Contract. The diagram below illustrates this workflow.

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/Staking.png" width="700" /></p>

ZRX can simlarly be unstaked by withdrawing tokens from the Staking contract. However, there are time-restrictions on unstaking ZRX, which are discussed more later in this section.

Below is the interface for staking and unstaking.

```
/// @dev Stake ZRX tokens. Tokens are deposited into the ZRX Vault.
/// @param amount of ZRX to stake.
function stake(uint256 amount) external;

/// @dev Unstake. Tokens are withdrawn from the ZRX Vault and returned to the owner.
/// @param amount of ZRX to unstake.
function unstake(uint256 amount) external;
```

### 5.1 Staking Pools

Staking pools can be created to leverage the weight of other stakers. A pool has a single operator and any number of members, who delegate their ZRX to the pool. Any staker can create a pool, although at present it is only beneficial for market makers to create staking pools. This is discussed more in Section 6, along with details on creating a staking pool.

|Term|Definition  |
|--|--|
| Pool Id | A unique id generated by this contract and assigned to each pool when it is created. |
| Pool Operator | The creator and operator of the pool. |
| Pool Members | Members of the pool who opted-in by delegating to the pool. |


### 5.2 Stake Status
Each staked ZRX has an associated status that reflects its utility within the 0x Ecosystem.

|Status|Definition  |
|--|--|
| Active | Can be used to participate in governance. This is the default status. |
| Inactive | Carries no utility within the 0x ecosystem. |
| Inactive & Withdrawable | Once ZRX has been inactive for one full epoch it can be withdrawn. |
| Delegated | ZRX is delegated to a pool; can be used in governance + contribute to liquidity rewards. |

There is a single function for moving stake between statuses:
```
/// @dev Moves stake between statuses: 'active', 'inactive' or 'delegated'.
///      This change comes into effect next epoch.
/// @param from status to move stake out of.
/// @param to status to move stake into.
/// @param amount of stake to move.
function moveStake(
    IStructs.StakeInfo calldata from,
    IStructs.StakeInfo calldata to,
    uint256 amount
) external;

/// @dev Info used to describe a status.
/// @param status of the stake.
/// @param poolId Unique Id of pool. This is set when status=DELEGATED.
struct StakeInfo {
    StakeStatus status;
    bytes32 poolId;
}

/// @dev Statuses that stake can exist in.
enum StakeStatus {
    ACTIVE,
    INACTIVE,
    DELEGATED
}
```

Note that when stake is moved its new status comes into effect on the _next epoch_. Stake remains in its current status until the end of the current epoch.

### 5.3 Querying Stake

The interface below describes how to query balances in the Staking Contract.

```
/// @dev Balance struct for stake.
/// @param currentEpochBalance Balance in the current epoch.
/// @param nextEpochBalance Balance in the next epoch.
struct StakeBalance {
    uint256 currentEpochBalance;
    uint256 nextEpochBalance;
}

/// @dev Returns the total active stake across the entire staking system.
/// @return Global active stake.
function getGlobalActiveStake()
    external
    view
    returns (IStructs.StakeBalance memory balance);

/// @dev Returns the total inactive stake across the entire staking system.
/// @return Global inactive stake.
function getGlobalInactiveStake()
    external
    view
    returns (IStructs.StakeBalance memory balance);

/// @dev Returns the total stake delegated across the entire staking system.
/// @return Global delegated stake.
function getGlobalDelegatedStake()
    external
    view
    returns (IStructs.StakeBalance memory balance);

/// @dev Returns the total stake for a given owner.
/// @param owner of stake.
/// @return Total active stake for owner.
function getTotalStake(address owner)
    external
    view
    returns (uint256);

/// @dev Returns the active stake for a given owner.
/// @param owner of stake.
/// @return Active stake for owner.
function getActiveStake(address owner)
    external
    view
    returns (IStructs.StakeBalance memory balance);

/// @dev Returns the inactive stake for a given owner.
/// @param owner of stake.
/// @return Inactive stake for owner.
function getInactiveStake(address owner)
    external
    view
    returns (IStructs.StakeBalance memory balance);

/// @dev Returns the stake delegated by a given owner.
/// @param owner of stake.
/// @return Delegated stake for owner.
function getStakeDelegatedByOwner(address owner)
    external
    view
    returns (IStructs.StakeBalance memory balance);

/// @dev Returns the amount stake that can be withdrawn for a given owner.
/// @param owner of stake.
/// @return Withdrawable stake for owner.
function getWithdrawableStake(address owner)
    public
    view
    returns (uint256);

/// @dev Returns the stake delegated to a specific staking pool, by a given owner.
/// @param owner of stake.
/// @param poolId Unique Id of pool.
/// @return Stake delegaated to pool by owner.
function getStakeDelegatedToPoolByOwner(address owner, bytes32 poolId)
    public
    view
    returns (IStructs.StakeBalance memory balance);

/// @dev Returns the total stake delegated to a specific staking pool,
///      across all members.
/// @param poolId Unique Id of pool.
/// @return Total stake delegated to pool.
function getTotalStakeDelegatedToPool(bytes32 poolId)
    public
    view
    returns (IStructs.StakeBalance memory balance);
```

## 6 Liquidity Incentives

Liquidity incentives are used to align market participants with long-term objectives of the 0x protocol. Fees are charged by the 0x protocol and paid to market makers as a reward for their trade volume and amount of ZRX staked.

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/ProtocolFee.png" width="700" /></p>

The protocol fee is paid in either WETH or ETH. If ETH is not included in the transaction (by setting `msg.value`) then the fee will be taken in WETH from the taker, as illustrated in the diagram above.

Note also that the WETH Asset Proxy is distinct from the standard ERC20 Asset Proxy, used by the exchange. There are two reasons for this. Firstly, this separation means that users must explicitly opt-in to fees (no hidden fees). Secondly, the Staking Contract only needs access to WETH, whereas the ERC20 Proxy would provide access to _all_ tokens that a user has given allowance for; since the Staking Contract is upgradable, this separation reduces the attack surface.

### 6.1 Market Making

We want to align market makers with the long-term objectives of the 0x protocol; however, the immobility of staked ZRX exposes makers to potential short-term volatility in the crypto markets. This risk is mitigated through staking pools.

A maker creates a pool, which can be delegated to by any other staker. When computing a maker's reward, we account for all the stake in their pool. We favor ZRX staked directly by the maker by assigning a lower weight (90%) to ZRX delegated by other stakers.

Market makers incentivize delegators to join their pool by setting aside a fixed percentage of their reward for the members of their pool. A member receives an amount of this percentage that is proportional to how much stake they have delegated to the pool.

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/Rewards.png" width="700" /></p>

The interface below describes how to create a pool, add market making addresses, and set the percentage of rewards for pool members.

Note that a single staker can operate several pools, but a market making address can only belong to one pool.
Note also that the operator's reward share can only be decreased: so the change can only ever benefit pool members.

```
/// @dev Create a new staking pool. The sender will be the operator of this pool.
/// Note that an operator must be payable.
/// @param operatorShare Portion of rewards owned by the operator, in ppm.
/// @param addOperatorAsMaker Adds operator to the created pool as a maker for convenience iff true.
/// @return poolId The unique pool id generated for this pool.
function createStakingPool(uint32 operatorShare, bool addOperatorAsMaker)
    external
    returns (bytes32 poolId);

/// @dev Adds a maker to a staking pool. Note that this is only callable by the pool operator.
/// Note also that the maker must have previously called joinStakingPoolAsMaker.
/// @param poolId Unique id of pool.
/// @param makerAddress Address of maker.
function addMakerToStakingPool(
    bytes32 poolId,
    address makerAddress
) external;

/// @dev Allows caller to join a staking pool if already assigned.
/// @param poolId Unique id of pool.
function joinStakingPoolAsMaker(bytes32 poolId) external;

/// @dev Removes a maker from a staking pool. Note that this is only callable by the pool operator or maker.
/// Note also that the maker does not have to *agree* to leave the pool; this action is
/// at the sole discretion of the pool operator.
/// @param poolId Unique id of pool.
/// @param makerAddress Address of maker.
function removeMakerFromStakingPool(
    bytes32 poolId,
    address makerAddress
) external;

/// @dev Returns the pool id of the input maker.
/// @param makerAddress Address of maker
/// @return Pool id, nil if maker is not yet assigned to a pool.
function getStakingPoolIdOfMaker(address makerAddress)
    public
    view
    returns (bytes32);

/// @dev Holds the metadata for a staking pool.
/// @param initialized True iff the balance struct is initialized.
/// @param operator of the pool.
/// @param operatorShare Fraction of the total balance owned by the operator, in ppm.
/// @param numberOfMakers Number of makers in the pool.
struct Pool {
    bool initialized;
    address payable operator;
    uint32 operatorShare;
    uint32 numberOfMakers;
}

/// @dev Returns a staking pool
/// @param poolId Unique id of pool.
function getStakingPool(bytes32 poolId)
    public
    view
    returns (IStructs.Pool memory);

/// @dev Decreases the operator share for the given pool (i.e. increases pool rewards for members).
/// @param poolId Unique Id of pool.
/// @param newOperatorShare The newly decreased percentage of any rewards owned by the operator.
function decreaseStakingPoolOperatorShare(bytes32 poolId, uint32 newOperatorShare) external;
```

### 6.2 Paying Liquidity Rewards (Finalization)

The Cobb-Douglas function is used to compute how much of the aggregate fees should be rewarded to each market maker.

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/CobbDouglas.png" width="200" /></p>

|Term|Definition  |
|--|--|
| _r_ | Reward for a specific market maker. |
| _R_ | Total reward to be split between all market makers. |
| _f_ | Total fees earned by the market maker this epoch. |
| _F_ | Total fees earned across all (staked) market maker pools this epoch. |
| _d_ | Total weighted ZRX staked by the market maker's pool this epoch. |
| _D_ | Total weighted ZRX staked across all (active) market maker pools this epoch. |
| _α_ | A constant in the range [0..1] that determines the weight of fees vs stake. |

At the end of an epoch, each pool that actively traded can retrieve their liquidity reward. This is done by calling the finalize function.

```
/// @dev Instantly finalizes a single pool that was active in the previous
///      epoch, crediting it rewards for members and withdrawing operator's
///      rewards as WETH. This can be called by internal functions that need
///      to finalize a pool immediately. Does nothing if the pool is already
///      finalized or was not active in the previous epoch.
/// @param poolId The pool ID to finalize.
/// @return operatorReward The reward credited to the pool operator.
/// @return membersReward The reward credited to the pool members.
/// @return membersStake The total stake for all non-operator members in
///         this pool.
function finalizePool(bytes32 poolId)
    public
    returns (
        uint256 operatorReward,
        uint256 membersReward,
        uint256 membersStake
    );
```

Each pool has until the end of the current epoch to finalize their pool for the previous epoch. During finalization the market maker will be paid their % of the reward in WETH. Pool members are paid when they modify how much stake they've delegated to the pool (or undelegate). Altenratively, members can retrieve their reward in WETH by calling the withdraw function.

```
/// @dev Syncs rewards for a delegator. This includes transferring WETH
///      rewards to the delegator, and adding/removing
///      dependencies on cumulative rewards.
///      This is used by a delegator when they want to sync their rewards
///      without delegating/undelegating. It's effectively the same as
///      delegating zero stake.
/// @param poolId Unique id of pool.
function withdrawDelegatorRewards(bytes32 poolId) external;
```

Both operators and delegators can compute their unpaid balance in a pool using the functions below.

```
/// @dev Computes the reward balance in ETH of the operator of a pool.
/// @param poolId Unique id of pool.
/// @return totalReward Balance in ETH.
function computeRewardBalanceOfOperator(bytes32 poolId)
    external
    view
    returns (uint256 reward);

/// @dev Computes the reward balance in ETH of a specific member of a pool.
/// @param poolId Unique id of pool.
/// @param member The member of the pool.
/// @return totalReward Balance in ETH.
function computeRewardBalanceOfDelegator(bytes32 poolId, address member)
    external
    view
    returns (uint256 reward);
```

## 7 Batch Calls

The staking contract supports arbitrary batch function calls, allowing for several operations in a single transaction. For example, finalizing several pools in one transaction.

```
/// @dev Batch executes a series of calls to the staking contract.
/// @param data An array of data that encodes a sequence of functions to
///             call in the staking contracts.
function batchExecute(bytes[] calldata data)
    external
    returns (bytes[] memory batchReturnData);
```

## 8 Staking Events

The events below are defined in [IStakingEvents](https://github.com/0xProject/0x-monorepo/blob/3.0/contracts/staking/contracts/src/interfaces/IStakingEvents.sol).

```
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
/// @param zrxVaultAddress Address of the ZrxVault contract.
event ParamsSet(
    uint256 epochDurationInSeconds,
    uint32 rewardDelegatedStakeWeight,
    uint256 minimumPoolStake,
    uint256 maximumMakersInPool,
    uint256 cobbDouglasAlphaNumerator,
    uint256 cobbDouglasAlphaDenominator,
    address wethProxyAddress,
    address zrxVaultAddress
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
    bytes32 indexed poolId,
    address makerAddress
);

/// @dev Emitted by MixinStakingPool when a new maker is added to a pool.
/// @param poolId Unique id of pool.
/// @param makerAddress Adress of maker added to pool.
event MakerAddedToStakingPool(
    bytes32 indexed poolId,
    address makerAddress
);

/// @dev Emitted by MixinStakingPool when a maker is removed from a pool.
/// @param poolId Unique id of pool.
/// @param makerAddress Adress of maker added to pool.
event MakerRemovedFromStakingPool(
    bytes32 indexed poolId,
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
```

## 9 Algorithms, Data Structures & Design Patterns

This section dives deeper into the mechanics of the smart contracts.

### 9.1 Securing the Proxy Pattern

The proxy pattern splits the state and logic into different contracts, allowing the logic contract to be upgraded. This is achieved using a `delegate_call` from the state contract into the logic contract.

One of the dangers in this pattern is that the storage slot or offset could change in a future version of Solidity. This could happen for any number of reasons; the most likely of which is that the order of state variables changes between two versions of the logic contract. An error like this would certainly be catastrophic, as the state variables in the logic contract would point to _different_ variables in the state contract.

One way to mitigate this danger is to store the state variables in a single immutable contract, which is inherited by both the state and logic contract. This will work, but it does not future-proof against external changes that may result from changes to Solidity or the EVM.

The best way we found to mitigate this danger is with runtime sanity checks. We hardcode the expected slot and offset of each state variable and assert the value every time the logic contract is updated. This is handled in the Staking Contract constructor [here](https://github.com/0xProject/0x-monorepo/blob/3.0/contracts/staking/contracts/src/Staking.sol).

See [LibProxy](https://github.com/0xProject/0x-monorepo/blob/3.0/contracts/staking/contracts/src/libs/LibProxy.sol) for the proxy code.

### 9.2 The Read-Only Proxy

The [read-only proxy](https://github.com/0xProject/0x-monorepo/blob/3.0/contracts/staking/contracts/src/ReadOnlyProxy.sol) is stateless and sits between the Staking Contract Proxy and Staking Contract. It forces every call to be read-only by using a force-revert delegate-call.

Steps:
1. The read-only proxy delegates the incoming call to itself.
2. On re-entry, we delegate to the Staking Contract and then _reverts_ with the return data.
3. The revert is caught and returned to the Staking Proxy.

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/Read-Only%20Proxy.png" width="600" /></p>

See [LibProxy](https://github.com/0xProject/0x-monorepo/blob/3.0/contracts/staking/contracts/src/libs/LibProxy.sol) for the proxy code.

### 9.3 Tracking for Reward Balances for Pool Members


This section describes the workflow for tracking and computing the portion of a pool's reward that belongs to a given member. The general equations for this are shown below.

A pool with _D_ delegated stake that earned _R_ rewards for its pool members in a given epoch, the reward (_r_) for a member that delegated _d_ stake is computed by:

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/reward_tracking/RewardSingleEpoch.png" height="60" /></p>


The member's reward after n epochs (given member does not change their stake) is then given by:

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/reward_tracking/RewardAfterManyEpochs.png" height="60" /></p>


When a member modifies their stake in the pool, the [StoredBalance struct](https://github.com/0xProject/0x-monorepo/blob/3.0/contracts/staking/contracts/src/interfaces/IStructs.sol) gives us:
1. How many epochs they were staked (`n`)
2. How much stake they had contributed during those epochs (`d`)

In addition to these values, we also need sum of ratios `R_k / D_k`, for each epoch `k` that the member was delegated. This ratio is available during the pool's finalization of epoch `k`. We are able to do store this information concisely using a cumulative sum of these reward ratios, as follows:

We store the following ratio for each epoch that a reward is earned for the pool:
<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/reward_tracking/WhatWeStore.png" height="60" /></p>

We compute a member's reward using the following equation:
<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/reward_tracking/RewardFromWhatWeStore.png" height="40" /></p>

Example:

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/reward_tracking/RewardFromWhatWeStore-Example.png" height="60" /></p>

This cumulative reward along with the stored balance of a member, we are able to compute their reward in the pool at any time.

This information is stored on-chain as follows:
```
// mapping from Owner to Pool Id to Amount Delegated
mapping (address  =>  mapping (bytes32  => IStructs.StoredBalance)) internal _delegatedStakeToPoolByOwner;

// mapping from Pool Id to Amount Delegated
mapping (bytes32  => IStructs.StoredBalance) internal _delegatedStakeByPoolId;

// mapping from Pool Id to Epoch to Reward Ratio
mapping (bytes32  =>  mapping (uint256  => IStructs.Fraction)) internal _cumulativeRewardsByPool;
```

#### 9.3.1 Computing Rewards - in Practice

In the equations above, a staker earned rewards from epochs `[0..n]`. This means that the staker undelegated during epoch `n` and stopped earning rewards in epoch `n+1`. So at the time of the call, we don't have access to the reward for epoch `n`.

In practice, this equation becomes:
<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/reward_tracking/RewardAfterManyEpochs-InPractice.png" height="60" /></p>


The final equation for computing a member's reward during epoch `n` becomes:

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/reward_tracking/Reward-Final.png" height="60" /></p>


#### 9.3.2 Handling Epochs With No Rewards

To compute a member's reward using this algorithm, we need to know the cumulative rewards at the entry and exit epoch of the member. But, what happens if no reward was recorded during one of these epochs?

In this case, there will be `nil` entry in `cumulativeRewardsByPool`. However, this isn't a problem. If a reward is earned in epoch *n* but not epoch *n + 1* then the cumulative rewards will not have changed. So in epoch *n + 1* we can simply use the entry for epoch *n*.

We keep track of the last epoch that the `cumulativeRewardsByPool` was updated in using the following state variable:

```
// mapping from Pool Id to Epoch
mapping (bytes32  =>  uint256) internal cumulativeRewardsByPoolLastStored;
```


### 9.4 Stake Management

Below are the design objectives of stake management:

1. Freshly minted stake is active.
2. Delegating, un-delegating and re-delegating stake comes into effect next epoch.
3. Users can freely adjust the distribution of their stake for the next epoch.
4. Stake can be withdrawn after it is inactive for one full epoch.

There are three statuses that stake can exist in: Active, Inactive or Delegated. Each state has three fields:

1. How much stake is currently in this state (cur)
2. How much stake is in this state next epoch (next)
3. The last time this state was stored

These fields combined allow us to compute the correct values at any given epoch without user intervention.
Inactive stake includes a Withdrawable field (W) that reflects how much stake can be withdrawn at any given time.

The figure below illustrates how these fields are updted to track a user's stake.

<p align="center"><img src="https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/StakeManagementExample.jpg" width="700" /></p>
