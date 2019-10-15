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

    /// @dev State of stakingProxy read-only mode.
    /// @param isReadOnlyModeSet True if in read-only mode.
    /// @param lastSetTimestamp Timestamp at which read-only mode was last set.
    struct ReadOnlyState {
        bool isReadOnlyModeSet;
        uint96 lastSetTimestamp;
    }

    /// @dev Stats for a given pool.
    /// @param feesCollected Fees collected in ETH by this pool.
    /// @param weightedStake Amount of weighted stake in the pool.
    /// @param membersStake Amount of non-operator stake in the pool.
    struct PoolStats {
        uint256 feesCollected;
        uint256 weightedStake;
        uint256 membersStake;
    }

    /// @dev Holds stats aggregated across a set of pools.
    /// @param rewardsAvailable Total WETH available for pools that earned rewards.
    /// @param poolsRemaining The number of pools that earned rewards.
    /// @param totalFeesCollected The total fees collected across all pools that earned rewards.
    /// @param totalWeightedStake The total weighted stake across all pools that earned rewards.
    /// @param totalRewardsPaid The total rewards that have been paid to pools.
    struct AggregatedStats {
        uint256 rewardsAvailable;
        uint256 poolsRemaining;
        uint256 totalFeesCollected;
        uint256 totalWeightedStake;
        uint256 totalRewardsPaid;
    }

    /// @dev Encapsulates a balance for the current and next epochs.
    /// Note that these balances may be stale if the current epoch
    /// is greater than `currentEpoch`.
    /// @param currentEpoch the current epoch
    /// @param currentEpochBalance balance in the current epoch.
    /// @param nextEpochBalance balance in `currentEpoch+1`.
    struct StoredBalance {
        uint64 currentEpoch;
        uint96 currentEpochBalance;
        uint96 nextEpochBalance;
    }

    /// @dev Statuses that stake can exist in.
    ///      Any stake can be (re)delegated effective at the next epoch
    ///      Undelegated stake can be withdrawn if it is available in both the current and next epoch
    enum StakeStatus {
        UNDELEGATED,
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

    /// @dev Holds the metadata for a staking pool.
    /// @param operator of the pool.
    /// @param operatorShare Fraction of the total balance owned by the operator, in ppm.
    struct Pool {
        address operator;
        uint32 operatorShare;
    }
}
