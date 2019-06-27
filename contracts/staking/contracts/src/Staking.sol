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

import "./interfaces/IStaking.sol";
import "./core/MixinExchangeManager.sol";
import "./core/MixinZrxVault.sol";
import "./core/MixinRewardVault.sol";
import "./core/MixinScheduler.sol";
import "./core/MixinStakeBalances.sol";
import "./core/MixinStake.sol";
import "./core/MixinPools.sol";
import "./core/MixinFees.sol";
import "./core/MixinRewards.sol";


contract Staking is
    IStaking,
    MixinDeploymentConstants,
    MixinConstants,
    MixinStorage,
    MixinScheduler,
    MixinRewardVault,
    MixinZrxVault,
    MixinExchangeManager,
    MixinStakeBalances,
    MixinPools,
    MixinRewards,
    MixinStake,
    MixinFees
{

    // this contract can receive ETH
    // solhint-disable no-empty-blocks
    function ()
        external
        payable
    {}
}
