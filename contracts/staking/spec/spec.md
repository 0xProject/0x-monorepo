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

## 3 Contract Management

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


### 6.1 Market Making

Makers are paid their reward at the end of every epoch. The Cobb-Douglas function is used to compute how much of the aggregate fees should be rewarded to each market maker. Market makers create staking pools to

###

### 6.1 The Protocol Fee




### 6.1 Finalizing Rewards

At the end of an epoch each pool that actively traded gets paid their liquidity reward. Pools are paid out individually via a contract call to the staking system (that can be made by anyone)
    3. You have until the end of the next trading period to payout every pool from the previous epoch
    4. In the beginning we have a bunch of keepers that wait for the trading period end then go in and finalize for each pool
    5. In the future once there’s substantial liquidity rewards being generated then there will be a higher incentive for the MM to call this function



## 9 Staking Events

## 10 Algorithms and Data Structures

### 10.1 Stake Management

### 10.2 Reward Tracking

### 10.3 Computing Cobb-Douglas

### 10.4 The Proxy Pattern & Read-Only Calls

Ensuring the storage slot has not been changed.





