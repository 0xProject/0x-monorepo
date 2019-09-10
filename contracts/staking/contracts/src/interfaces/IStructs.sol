/*

  Copyright 2019 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.5.9;


interface IStructs {

    /// @dev Allowed signature types.
    enum SignatureType {
        Illegal,            // 0x00, default value
        Invalid,            // 0x01
        EIP712,             // 0x02
        EthSign,            // 0x03
        Wallet,             // 0x04
        NSignatureTypes     // 0x05, number of signature types. Always leave at end.
    }

    /// @dev Status for Staking Pools (see MixinStakingPool).
    /// @param operatorAddress Address of pool operator.
    /// @param operatorShare Portion of pool rewards owned by operator, in ppm.
    struct Pool {
        address payable operatorAddress;
        uint32 operatorShare;
    }

    /// @dev Status for a pool that actively traded during the current epoch.
    /// (see MixinExchangeFees).
    /// @param poolId Unique Id of staking pool.
    /// @param feesCollected Fees collected in ETH by this pool in the current epoch.
    /// @param weightedStake Amount of weighted stake currently held by the pool.
    struct ActivePool {
        bytes32 poolId;
        uint256 feesCollected;
        uint256 weightedStake;
        uint256 delegatedStake;
    }

    /// @dev Encapsulates a balance for the current and next epochs.
    /// Note that these balances may be stale if the current epoch
    /// is greater than `currentEpoch`.
    /// Always load this struct using _loadAndSyncBalance or _loadUnsyncedBalance.
    /// @param isInitialized
    /// @param currentEpoch the current epoch
    /// @param currentEpochBalance balance in the current epoch.
    /// @param nextEpochBalance balance in the next epoch.
    struct StoredBalance {
        bool isInitialized;
        uint32 currentEpoch;
        uint96 currentEpochBalance;
        uint96 nextEpochBalance;
    }

    /// @dev Balance struct for stake.
    /// @param currentEpochBalance Balance in the current epoch.
    /// @param nextEpochBalance Balance in the next epoch.
    struct StakeBalance {
        uint256 currentEpochBalance;
        uint256 nextEpochBalance;
    }

    /// @dev Statuses that stake can exist in.
    enum StakeStatus {
        ACTIVE,
        INACTIVE,
        DELEGATED
    }

    /// @dev Info used to describe a status.
    /// @param status of the stake.
    /// @param poolId Unique Id of pool. This is set when status=DELEGATED.
    struct StakeInfo {
        StakeStatus status;
        bytes32 poolId;
    }

    /// @dev Struct to represent a fraction.
    /// @param numerator of fraction.
    /// @param denominator of fraction.
    struct Fraction {
        uint256 numerator;
        uint256 denominator;
    }

    /// @param fraction
    /// @param referenceCounter
    struct ReferenceCounter {
        uint256 referenceCount;
        mapping (address => bool) hasReference;
    }

    /// @dev State for keeping track of which pool a maker has joined, and if the operator has
    /// added them (see MixinStakingPool).
    /// @param poolId Unique Id of staking pool.
    /// @param confirmed Whether the operator has added the maker to the pool.
    struct MakerPoolJoinStatus {
        bytes32 poolId;
        bool confirmed;
    }

    struct CumulativeRewardInfo {
        IStructs.Fraction cumulativeReward;
        uint256 cumulativeRewardEpoch;
    }
}
