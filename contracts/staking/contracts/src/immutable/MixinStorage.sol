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
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/Authorizable.sol";
import "./MixinConstants.sol";
import "../interfaces/IZrxVault.sol";
import "../interfaces/IStructs.sol";
import "../libs/LibStakingRichErrors.sol";


// solhint-disable max-states-count, no-empty-blocks
contract MixinStorage is
    MixinConstants,
    Authorizable
{
    // address of staking contract
    address public stakingContract;

    // address of read-only proxy
    address public readOnlyProxy;

    // address for read-only proxy to call
    address public readOnlyProxyCallee;

    // mapping from StakeStatus to the total amount of stake in that status for the entire
    // staking system.
    mapping (uint8 => IStructs.StoredBalance) public globalStakeByStatus;

    // mapping from Owner to Amount of Active Stake
    // (access using _loadSyncedBalance or _loadUnsyncedBalance)
    mapping (address => IStructs.StoredBalance) internal _activeStakeByOwner;

    // Mapping from Owner to Amount of Inactive Stake
    // (access using _loadSyncedBalance or _loadUnsyncedBalance)
    mapping (address => IStructs.StoredBalance) internal _inactiveStakeByOwner;

    // Mapping from Owner to Amount Delegated
    // (access using _loadSyncedBalance or _loadUnsyncedBalance)
    mapping (address => IStructs.StoredBalance) internal _delegatedStakeByOwner;

    // Mapping from Owner to Pool Id to Amount Delegated
    // (access using _loadSyncedBalance or _loadUnsyncedBalance)
    mapping (address => mapping (bytes32 => IStructs.StoredBalance)) internal _delegatedStakeToPoolByOwner;

    // Mapping from Pool Id to Amount Delegated
    // (access using _loadSyncedBalance or _loadUnsyncedBalance)
    mapping (bytes32 => IStructs.StoredBalance) internal _delegatedStakeByPoolId;

    // mapping from Owner to Amount of Withdrawable Stake
    mapping (address => uint256) internal _withdrawableStakeByOwner;

    // tracking Pool Id
    bytes32 public nextPoolId = INITIAL_POOL_ID;

    // mapping from Maker Address to a struct representing the pool the maker has joined and
    // whether the operator of that pool has subsequently added the maker.
    // (access externally using `getStakingPoolIdOfMaker`)
    mapping (address => IStructs.MakerPoolJoinStatus) internal _poolJoinedByMakerAddress;

    // mapping from Pool Id to Pool
    mapping (bytes32 => IStructs.Pool) internal _poolById;

    // mapping from PoolId to balance of members
    mapping (bytes32 => uint256) public rewardsByPoolId;

    // current epoch
    uint256 public currentEpoch = INITIAL_EPOCH;

    // current epoch start time
    uint256 public currentEpochStartTimeInSeconds;

    // mapping from Pool Id to Epoch to Reward Ratio
    mapping (bytes32 => mapping (uint256 => IStructs.Fraction)) internal _cumulativeRewardsByPool;

    // mapping from Pool Id to Epoch
    mapping (bytes32 => uint256) internal _cumulativeRewardsByPoolLastStored;

    // registered 0x Exchange contracts
    mapping (address => bool) public validExchanges;

    /* Tweakable parameters */

    // Minimum seconds between epochs.
    uint256 public epochDurationInSeconds;

    // How much delegated stake is weighted vs operator stake, in ppm.
    uint32 public rewardDelegatedStakeWeight;

    // Minimum amount of stake required in a pool to collect rewards.
    uint256 public minimumPoolStake;

    // Maximum number of maker addresses allowed to be registered to a pool.
    uint256 public maximumMakersInPool;

    // Numerator for cobb douglas alpha factor.
    uint32 public cobbDouglasAlphaNumerator;

    // Denominator for cobb douglas alpha factor.
    uint32 public cobbDouglasAlphaDenominator;

    /* Finalization states */

    /// @dev The total fees collected in the current epoch, built up iteratively
    ///      in `payProtocolFee()`.
    uint256 public totalFeesCollectedThisEpoch;

    /// @dev The total weighted stake in the current epoch, built up iteratively
    ///      in `payProtocolFee()`.
    uint256 public totalWeightedStakeThisEpoch;

    /// @dev State information for each active pool in an epoch.
    ///      In practice, we only store state for `currentEpoch % 2`.
    mapping (uint256 => mapping (bytes32 => IStructs.ActivePool)) internal _activePoolsByEpoch;

    /// @dev Number of pools activated in the current epoch.
    uint256 public numActivePoolsThisEpoch;

    /// @dev State for unfinalized rewards.
    IStructs.UnfinalizedState public unfinalizedState;

    /// @dev The WETH balance of this contract that is reserved for pool reward payouts.
    uint256 public wethReservedForPoolRewards;

    /// @dev Adds owner as an authorized address.
    constructor()
        public
        Authorizable()
    {
        _addAuthorizedAddress(owner);
    }
}
