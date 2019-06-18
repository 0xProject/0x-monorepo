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

import "../core/MixinStake.sol";


contract MixinStakeWrapper is
    MixinStake
{

    function deposit(uint256 amount)
        external
    {
        _deposit(msg.sender, amount);
    }

    function depositAndStake(uint256 amount)
        external
    {
        _depositAndStake(msg.sender, amount);
    }

    function depositAndDelegate(bytes32 poolId, uint256 amount)
        external
    {
        _depositAndDelegate(msg.sender, poolId, amount);
    }

    function activateStake(uint256 amount)
        external
    {
        _activateStake(msg.sender, amount);
    }

    function activateAndDelegateStake(bytes32 poolId, uint256 amount)
        external
    {
        _activateAndDelegateStake(msg.sender, poolId, amount);
    }

    function deactivateAndTimelockStake(uint256 amount)
        external
    {
        _deactivateAndTimelockStake(msg.sender, amount);
    }

    function deactivateAndTimelockDelegatedStake(bytes32 poolId, uint256 amount)
        external
    {
        _deactivateAndTimelockDelegatedStake(msg.sender, poolId, amount);
    }

    function withdraw(uint256 amount)
        external
    {
        _withdraw(msg.sender, amount);
    }

    function forceTimelockSync(address owner)
        external
    {
        _forceTimelockSync(owner);
    }
}
