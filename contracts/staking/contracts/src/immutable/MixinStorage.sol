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

pragma solidity ^0.5.5;

import "../interfaces/IZrxVault.sol";
import "../interfaces/IStakingPoolRewardVault.sol";
import "./MixinConstants.sol";
import "../interfaces/IStructs.sol";


// solhint-disable max-states-count
contract MixinStorage is
    MixinDeploymentConstants,
    MixinConstants
{
    // address of owner
    address internal _owner;

    // address of staking contract
    address internal _stakingContract;

    // mapping from Owner to Amount Staked
    mapping (address => uint256) internal _stakeByOwner;

    // mapping from Owner to Amount of Instactive Stake
    mapping (address => uint256) internal _activatedStakeByOwner;

    // mapping from Owner to Amount Timelocked
    mapping (address => IStructs.Timelock) internal _timelockedStakeByOwner;

    // mapping from Owner to Amount Delegated
    mapping (address => uint256) internal _delegatedStakeByOwner;

    // mapping from Owner to Pool Id to Amount Delegated
    mapping (address => mapping (bytes32 => uint256)) internal _delegatedStakeToPoolByOwner;

    // mapping from Pool Id to Amount Delegated
    mapping (bytes32 => uint256) internal _delegatedStakeByPoolId;

    // total activated stake in the system
    uint256 internal _totalActivatedStake;

    // tracking Pool Id
    bytes32 internal _nextPoolId = INITIAL_POOL_ID;

    // mapping from Pool Id to Pool
    mapping (bytes32 => IStructs.Pool) internal _poolById;

    // mapping from Maker Address to Pool Id
    // A Maker can only hold a single token
    mapping (address => bytes32) internal _poolIdByMakerAddress;

    // mapping from Pool Id to Addresses
    mapping (bytes32 => address[]) internal _makerAddressesByPoolId;

    // current epoch
    uint64 internal _currentEpoch = INITIAL_EPOCH;

    // current epoch start time
    uint64 internal _currentEpochStartTimeInSeconds;

    // current withdrawal period
    uint64 internal _currentTimelockPeriod = INITIAL_TIMELOCK_PERIOD;

    // current epoch start time
    uint64 internal _currentTimelockPeriodStartEpoch = INITIAL_EPOCH;

    // State information for each active pool in an epoch.
    // In this case, epoch is actually `epoch % 2` since we only need state
    // for `currentEpoch` and `currentEpoch - 1`.
    mapping(uint256 => mapping(bytes32 => IStructs.ActivePool)) internal _activePoolsByEpoch;

    // Number of pools activated in the current epoch.
    uint256 internal _numActivePools;

    // Rewards (ETH) available to the epoch being finalized (the previous epoch).
    // This is simply the balance of the contract at the end of the epoch.
    uint256 internal _unfinalizedRewardsAvailable;

    // The number of active pools in the last epoch that have been pre-finalized
    // by `preFinalizePools()`.
    uint256 internal _numPreFinalizedPools;

    // The number of active pools in the last epoch that have yet to be finalized
    // through `finalizePools()`.
    uint256 internal _unfinalizedPoolsRemaining;

    // The total fees collected for the epoch being finalized.
    // This gets computed iteratively by `preFinalizePools()`.
    uint256 internal _unfinalizedTotalFeesCollected;

    // The total fees collected for the epoch being finalized.
    // This gets computed iteratively by `preFinalizePools()`.
    uint256 internal _unfinalizedTotalWeightedStake;

    // The total rewards paid in the last epoch.
    uint256 internal _rewardsPaidLastEpoch;

    // mapping from POol Id to Shadow Rewards
    mapping (bytes32 => uint256) internal _shadowRewardsByPoolId;

    // shadow balances by
    mapping (address => mapping (bytes32 => uint256)) internal _shadowRewardsInPoolByOwner;

    // registrered 0x exchanges
    mapping (address => bool) internal _validExchanges;

    // ZRX vault
    IZrxVault internal _zrxVault;

    // Rebate Vault
    IStakingPoolRewardVault internal _rewardVault;
}
