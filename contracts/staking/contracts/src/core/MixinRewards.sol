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

import "../immutable/MixinStorage.sol";
import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "../immutable/MixinConstants.sol";
import "../interfaces/IStakingEvents.sol";

contract MixinRewards is
    SafeMath,
    IStakingEvents,
    MixinConstants,
    MixinStorage
{
    // Pinciple - design any Mixin such that internal members are callable without messing up internal state
    //            any function that could mess up internal state should be private.



    function _computeOperatorReward(address operator, bytes32 poolId)
        internal
        view
        returns (uint256)
    {
    
    }

    function _computeDelegatorReward(address owner, bytes32 poolId)
        internal
        view
        returns (uint256)
    {

    }

    function _getShadowBalanceByPoolId(bytes32 poolId)
        internal
        view
        returns (uint256)
    {
        return shadowRewardsByPoolId[poolId];
    }

    function _getShadowBalanceInPoolByOwner(address owner, bytes32 poolId)
        internal
        view
        returns (uint256)
    {
        return shadowRewardsInPoolByOwner[owner][poolId];
    }

    /*
    function _withdrawReward(address owner, bytes32 poolId, uint256 amount)
        internal
    {

    }

    function _withdrawRewardForOperator(address owner, bytes32 poolId, uint256 amount)
        private
    {

    }
    */

    function _withdrawRewardForDelegator(address owner, bytes32 poolId, uint256 amount)
        internal
    {
        //rebateVault.withdrawFrom(owner, poolId, amount);
    }

/*
    function _withdrawTotalReward(address owner, bytes32 poolId)
        internal
        returns (uint256 amount)
    {
        
    }

    function _withdrawTotalRewardForOperator(address owner, bytes32 poolId)
        private
    {
        
    }

    function _withdrawTotalRewardForDelegator(address owner, bytes32 poolId, uint256 amount)
        private
    {
        
    }*/
}