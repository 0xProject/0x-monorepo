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

import "../interfaces/IZrxVault.sol";
import "../interfaces/IRewardVault.sol";
import "./MixinConstants.sol";
import "../interfaces/IStructs.sol";


// solhint-disable max-states-count
contract MixinStorage is
    MixinConstants
{

    // @TODO Add notes about which Mixin manages which state

    // address of staking contract
    address internal stakingContract;

    // mapping from Owner to Amount Staked
    mapping (address => uint256) internal stakeByOwner;

    // @TODO Think about merging these different states
    // It would be nice if the sum of the different states had to equal `stakeByOwner`
    // and it were all in a single variable (stakeByOwner in its own)

    // mapping from Owner to Amount of Instactive Stake
    mapping (address => uint256) internal activeStakeByOwner;

    // mapping from Owner to Amount Timelocked
    mapping (address => IStructs.Timelock) internal timelockedStakeByOwner;

    // mapping from Owner to Amount Delegated
    mapping (address => uint256) internal delegatedStakeByOwner;

    // mapping from Owner to Pool Id to Amount Delegated
    mapping (address => mapping (bytes32 => uint256)) internal delegatedStakeToPoolByOwner;

    // mapping from Pool Id to Amount Delegated
    mapping (bytes32 => uint256) internal delegatedStakeByPoolId;

    // total activated stake in the system
    uint256 internal totalActivatedStake;

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

    // current withdrawal period
    uint64 internal currentTimelockPeriod = INITIAL_TIMELOCK_PERIOD;

    // current epoch start time
    uint64 internal currentTimelockPeriodStartEpoch = INITIAL_EPOCH;

    // fees collected this epoch
    mapping (bytes32 => uint256) internal protocolFeesThisEpochByPool;

    // 
    bytes32[] internal activePoolIdsThisEpoch;

    // mapping from POol Id to Shadow Rewards
    mapping (bytes32 => uint256) internal shadowRewardsByPoolId;

    // shadow balances by
    mapping (address => mapping (bytes32 => uint256)) internal shadowRewardsInPoolByOwner;

    // registrered 0x exchanges
    mapping (address => bool) internal validExchanges;

    // ZRX vault
    IZrxVault internal zrxVault;

    // Rebate Vault
    IRewardVault internal rewardVault;
}
