/*

  Copyright 2018 ZeroEx Intl.

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

    /// @dev Required fields for a maker to approve a staking pool.
    /// @param poolId Unique Id of staking pool.
    /// @param makerAddress Address of maker who has approved the pool.
    struct StakingPoolApproval {
        bytes32 poolId;
        address makerAddress;
    }

    /// @dev State for Staking Pools (see MixinStakingPool).
    /// @param operatorAddress Address of pool operator.
    /// @param operatorShare Portion of pool rewards owned by operator, in ppm.
    struct Pool {
        address payable operatorAddress;
        uint32 operatorShare;
    }

    /// @dev State for a pool that actively traded during the current epoch.
    /// (see MixinExchangeFees).
    /// @param poolId Unique Id of staking pool.
    /// @param feesCollected Fees collected in ETH by this pool in the current epoch.
    /// @param weightedStake Amount of weighted stake currently held by the pool.
    struct ActivePool {
        bytes32 poolId;
        uint256 feesCollected;
        uint256 weightedStake;
    }

    /// @dev Tracks timeLocked stake (see MixinTimeLockedStake).
    /// @param lockedAt The TimeLock Period that stake was most recently locked at.
    /// @param total Amount of stake that is timeLocked.
    /// @param pending Stake pending to be un-TimeLocked next TimeLock Period.
    struct TimeLock {
        uint64 lockedAt;
        uint96 total;
        uint96 pending;
    }
}
