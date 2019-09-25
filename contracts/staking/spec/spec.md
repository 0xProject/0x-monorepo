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

![](https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/Staking%20Architecture%20-%20Basic.png)


### 2.1 Read-Only Mode

If a vulnerability is discovered in the staking contract, operations may be halted to conduct forensics:

1.  The 0x Exchange contract stops charging protocol fees.
2.  The staking contract is set to read-only mode.

![](https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/Staking%20Architecture%20-%20Read-Only.png)

### 2.2 Catastrophic Failure Mode

In this worst-case scenario, state has been irreparably corrupted and the staking contracts must be redeployed. Users would re-stake under the new system, at will.

1. The ZRX vault is detached from the staking contract.
2. Users withdraw their funds from the ZRX vault directly.

![](https://github.com/0xProject/0x-monorepo/blob/stakingspec/contracts/staking/spec/Staking%20Architecture%20-%20Catastrophic%20Failure.png)


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

Stake is minted when ZRX is deposited and burned when ZRX is withdrawn from the Staking Contract.





At any given time, Stake can exist in one of the following states.

### 5.1 Staking Pools

## 6 Market Making

## 7 Protocol Fees



## 8 Liquidity Rewards

## 9 Staking Events

## 10 Algorithms and Data Structures

### 10.1 Stake Management

### 10.2 Reward Tracking

### 10.3 Computing Cobb-Douglas

### 10.4 The Proxy Pattern & Read-Only Calls

Ensuring the storage slot has not been changed.





