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


contract MixinStorage {

    // address of staking contract
    address stakingContract;

    // mapping from Staker to Maker Id to Amount Staked
    mapping (address => mapping (bytes32 => uint256)) delegatedStake;

    // mapping from Staker to Maker Id to Amount Staked
    mapping (address => uint256) totalStake;

    // mapping from Maker Id to Amount of Delegated Staked
    mapping (bytes32 => uint256) totalDelegatedStake;

    // tracking Maker Id
    bytes32 nextMakerId;

    // mapping from Maker address to Maker Id
    // A Maker can only hold a single token
    mapping (address => bytes32) makerIds;

    // mapping from Maker Id to Addresses
    mapping (bytes32 => address[]) makerAddresses;

    // ZRX vault
    IVault zrxVault;

    // Rebate Vault
    IVault rebateVault;
}
