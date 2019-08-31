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

import "../interfaces/IZrxVault.sol";
import "../interfaces/IEthVault.sol";
import "../interfaces/IStakingPoolRewardVault.sol";
import "./MixinConstants.sol";
import "../interfaces/IStructs.sol";


// solhint-disable max-states-count
contract MixinStorage is
    MixinDeploymentConstants,
    MixinConstants
{

    // address of owner
    address internal owner;

    // address of staking contract
    address internal stakingContract;

    // mapping from Owner to Amount of Active Stake
    mapping (address => IStructs.DelayedBalance) internal activeStakeByOwner;

    // mapping from Owner to Amount of Inactive Stake
    mapping (address => IStructs.DelayedBalance) internal inactiveStakeByOwner;

    // mapping from Owner to Amount Delegated
    mapping (address => IStructs.DelayedBalance) internal delegatedStakeByOwner;

    // mapping from Owner to Pool Id to Amount Delegated
    mapping (address => mapping (bytes32 => IStructs.DelayedBalance)) internal delegatedStakeToPoolByOwner;

    // mapping from Pool Id to Amount Delegated
    mapping (bytes32 => IStructs.DelayedBalance) internal delegatedStakeByPoolId;

    // mapping from Owner to Amount of Withdrawable Stake
    mapping (address => uint256) internal withdrawableStakeByOwner;

    // tracking Pool Id
    bytes32 internal nextPoolId = INITIAL_POOL_ID;

    // mapping from Pool Id to Pool
    mapping (bytes32 => IStructs.Pool) internal poolById;

    // mapping from Maker Address to Pool Id
    // A Maker can only hold a single token
    mapping (address => bytes32) internal poolIdByMakerAddress;

    // mapping from Pool Id to Addresses
    mapping (bytes32 => address[]) internal makerAddressesByPoolId;

    // current epoch
    uint64 internal currentEpoch = INITIAL_EPOCH;

    // current epoch start time
    uint64 internal currentEpochStartTimeInSeconds;

    // fees collected this epoch
    mapping (bytes32 => uint256) internal protocolFeesThisEpochByPool;

    // pools that were active in the current epoch
    bytes32[] internal activePoolsThisEpoch;

    // reward ratios by epoch
    mapping (bytes32 => mapping (uint256 => IStructs.Fraction)) internal cumulativeRewardsByPool;

    mapping (bytes32 => uint256) internal cumulativeRewardsByPoolLastStored;

    // registrered 0x exchanges
    mapping (address => bool) internal validExchanges;

    // ZRX vault
    IZrxVault internal zrxVault;

    // Rebate Vault
    IEthVault internal ethVault;

    // Rebate Vault
    IStakingPoolRewardVault internal rewardVault;
}

