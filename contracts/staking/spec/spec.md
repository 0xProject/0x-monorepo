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
|Staking Contract Proxy|Stores staking state and delegates to the Staking Contract|
|ZRX Vault|Securely holds staked ZRX Tokens|
|Read-Only Proxy|Forces read-only calls to the Staking Contract|

### 2.1 Basic Architecture



### 2.2 Read-Only Mode

### 2.3 Catastrophic Failure Mode