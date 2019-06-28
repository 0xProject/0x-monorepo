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

import "../libs/LibSafeMath.sol";
import "../libs/LibRewardMath.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStakingEvents.sol";
import "./MixinZrxVault.sol";
import "./MixinStakingPoolRewardVault.sol";
import "./MixinScheduler.sol";
import "./MixinStakeBalances.sol";
import "./MixinTimelockedStake.sol";


contract MixinStake is
    IMixinScheduler,
    IStakingEvents,
    MixinDeploymentConstants,
    MixinConstants,
    MixinStorage,
    MixinZrxVault,
    MixinOwnable,
    MixinScheduler,
    MixinStakingPoolRewardVault,
    MixinStakeBalances,
    MixinTimelockedStake
{

    using LibSafeMath for uint256;

    function deposit(uint256 amount)
        external
    {
        _mintStake(msg.sender, amount);
    }

    function depositAndStake(uint256 amount)
        external
    {
        _mintStake(msg.sender, amount);
        activateStake(amount);
    }

    function withdraw(uint256 amount)
        external
    {
        address owner = msg.sender;
        _syncTimelockedStake(owner);
        require(
            getDeactivatedStake(owner) >= amount,
            "INSUFFICIENT_BALANCE"
        );
        _burnStake(owner, amount);
    }

    function activateStake(uint256 amount)
        public
    {
        address owner = msg.sender;
        _syncTimelockedStake(owner);
        require(
            amount <= getActivatableStake(owner),
            "INSUFFICIENT_BALANCE"
        );
        activeStakeByOwner[owner] = activeStakeByOwner[owner]._add(amount);
        totalActivatedStake = totalActivatedStake._add(amount);
    }

    function deactivateAndTimelockStake(uint256 amount)
        public
    {
        address owner = msg.sender;
        _syncTimelockedStake(owner);
        require(
            amount <= getActivatedStake(owner),
            "INSUFFICIENT_BALANCE"
        );
        activeStakeByOwner[owner] = activeStakeByOwner[owner]._sub(amount);
        totalActivatedStake = totalActivatedStake._sub(amount);
        _timelockStake(owner, amount);
    }


    function _mintStake(address owner, uint256 amount)
        internal
    {
        // deposit equivalent amount of ZRX into vault
        _depositFromOwnerIntoZrxVault(owner, amount);

        // mint stake
        stakeByOwner[owner] = stakeByOwner[owner]._add(amount);

        // emit stake event
        emit StakeMinted(
            owner,
            amount
        );
    }

    function _burnStake(address owner, uint256 amount)
        internal
    {
        // burn stake
        stakeByOwner[owner] = stakeByOwner[owner]._sub(amount);

        // withdraw equivalent amount of ZRX from vault
        _withdrawToOwnerFromZrxVault(owner, amount);

        // emit stake event
        emit StakeBurned(
            owner,
            amount
        );
    }
}
