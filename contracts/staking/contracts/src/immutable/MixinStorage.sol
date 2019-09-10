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

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetProxy.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/Ownable.sol";
import "./MixinConstants.sol";
import "../interfaces/IZrxVault.sol";
import "../interfaces/IEthVault.sol";
import "../interfaces/IStakingPoolRewardVault.sol";
import "../interfaces/IStructs.sol";
import "../libs/LibStakingRichErrors.sol";


// solhint-disable max-states-count, no-empty-blocks
contract MixinStorage is
    MixinConstants,
    Ownable
{

    // WETH Asset Proxy
    IAssetProxy internal wethAssetProxy;

    // address of staking contract
    address internal stakingContract;

    // address of read-only proxy
    address internal readOnlyProxy;

    // address for read-only proxy to call
    address internal readOnlyProxyCallee;

    // mapping from Owner to Amount of Active Stake
    // (access using _loadAndSyncBalance or _loadUnsyncedBalance)
    mapping (address => IStructs.StoredBalance) internal activeStakeByOwner;

    // mapping from Owner to Amount of Inactive Stake
    // (access using _loadAndSyncBalance or _loadUnsyncedBalance)
    mapping (address => IStructs.StoredBalance) internal inactiveStakeByOwner;

    // mapping from Owner to Amount Delegated
    // (access using _loadAndSyncBalance or _loadUnsyncedBalance)
    mapping (address => IStructs.StoredBalance) internal delegatedStakeByOwner;

    // mapping from Owner to Pool Id to Amount Delegated
    // (access using _loadAndSyncBalance or _loadUnsyncedBalance)
    mapping (address => mapping (bytes32 => IStructs.StoredBalance)) internal delegatedStakeToPoolByOwner;

    // mapping from Pool Id to Amount Delegated
    // (access using _loadAndSyncBalance or _loadUnsyncedBalance)
    mapping (bytes32 => IStructs.StoredBalance) internal delegatedStakeByPoolId;

    // mapping from Owner to Amount of Withdrawable Stake
    mapping (address => uint256) internal withdrawableStakeByOwner;

    // tracking Pool Id
    bytes32 internal nextPoolId = INITIAL_POOL_ID;

    // mapping from Maker Address to a struct representing the pool the maker has joined and
    // whether the operator of that pool has subsequently added the maker.
    mapping (address => IStructs.MakerPoolJoinStatus) internal poolJoinedByMakerAddress;

    // mapping from Pool Id to number of makers assigned to that pool
    mapping (bytes32 => uint256) internal numMakersByPoolId;

    // current epoch
    uint256 internal currentEpoch = INITIAL_EPOCH;

    // current epoch start time
    uint256 internal currentEpochStartTimeInSeconds;

    // fees collected this epoch
    mapping (bytes32 => uint256) internal protocolFeesThisEpochByPool;

    // pools that were active in the current epoch
    bytes32[] internal activePoolsThisEpoch;

    // mapping from Pool Id to Epoch to Reward Ratio
    mapping (bytes32 => mapping (uint256 => IStructs.Fraction)) internal cumulativeRewardsByPool;

    // mapping from Pool Id to Epoch
    mapping (bytes32 => uint256) internal cumulativeRewardsByPoolLastStored;

    // registered 0x Exchange contracts
    mapping (address => bool) internal validExchanges;

    // ZRX vault (stores staked ZRX)
    IZrxVault internal zrxVault;

    // ETH Vault (stores eth balances of stakers and pool operators)
    IEthVault internal ethVault;

    // Rebate Vault (stores rewards for pools before they are moved to the eth vault on a per-user basis)
    IStakingPoolRewardVault internal rewardVault;

    // Minimum seconds between epochs.
    uint256 internal epochDurationInSeconds;

    // How much delegated stake is weighted vs operator stake, in ppm.
    uint32 internal rewardDelegatedStakeWeight;

    // Minimum amount of stake required in a pool to collect rewards.
    uint256 internal minimumPoolStake;

    // Maximum number of maker addresses allowed to be registered to a pool.
    uint256 internal maximumMakersInPool;

    // Numerator for cobb douglas alpha factor.
    uint32 internal cobbDouglasAlphaNumerator;

    // Denominator for cobb douglas alpha factor.
    uint32 internal cobbDouglasAlphaDenomintor;
}
