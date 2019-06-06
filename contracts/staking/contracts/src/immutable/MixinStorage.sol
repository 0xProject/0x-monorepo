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

pragma solidity ^0.5.5;

import "../interfaces/IVault.sol";
import "./MixinConstants.sol";
import "../interfaces/IStructs.sol";


contract MixinStorage is
    IStructs,
    MixinConstants
{

    // address of staking contract
    address stakingContract;

    // mapping from Owner to Amount Staked
    mapping (address => uint256) stakeByOwner;

    // mapping from Owner to Amount of Instactive Stake
    mapping (address => uint256) activeStakeByOwner;

    // mapping from Owner to Amount Timelocked
    mapping (address => Timelock) timelockedStakeByOwner;

    // mapping from Owner to Amount Delegated
    mapping (address => uint256) delegatedStakeByOwner;

    // mapping from Owner to Pool Id to Amount Delegated
    mapping (address => mapping (bytes32 => uint256)) delegatedStakeToPoolByOwner;

    // mapping from Pool Id to Amount Delegated
    mapping (bytes32 => uint256) delegatedStakeByPoolId;

    // tracking Pool Id
    bytes32 nextPoolId = INITIAL_POOL_ID;

    // mapping from Pool Id to Pool
    mapping (bytes32 => Pool) poolById;

    // mapping from Maker Address to Pool Id
    // A Maker can only hold a single token
    mapping (address => bytes32) poolIdByMakerAddress;

    // mapping from Pool Id to Addresses
    mapping (bytes32 => address[]) makerAddressesByPoolId;

    // current epoch
    uint64 currentEpoch = INITIAL_EPOCH;

    // current epoch start time
    uint64 currentEpochStartTimeInSeconds;

    // current withdrawal period
    uint64 currentTimelockPeriod = INITIAL_TIMELOCK_PERIOD;

    // current epoch start time
    uint64 currentTimelockPeriodStartEpoch = INITIAL_EPOCH;

    // fees collected this epoch
    mapping (bytes32 => uint256) feesCollectedThisEpochByPoolId;

    // 
    bytes32[] activePoolIdsThisEpoch;

    // ZRX vault
    IVault zrxVault;

    // Rebate Vault
    IVault rebateVault;
}
