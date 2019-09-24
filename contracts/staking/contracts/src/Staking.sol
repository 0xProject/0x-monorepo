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

import "./interfaces/IStaking.sol";
import "./sys/MixinParams.sol";
import "./sys/MixinFinalizer.sol";
import "./stake/MixinStake.sol";
import "./staking_pools/MixinStakingPool.sol";
import "./fees/MixinExchangeFees.sol";


contract Staking is
    IStaking,
    IStakingEvents,
    MixinAbstract,
    MixinConstants,
    Ownable,
    MixinStorage,
    MixinStakingPoolModifiers,
    MixinExchangeManager,
    MixinScheduler,
    MixinParams,
    MixinStakeStorage,
    MixinStakingPoolMakers,
    MixinStakeBalances,
    MixinCumulativeRewards,
    MixinStakingPoolRewards,
    MixinFinalizer,
    MixinStakingPool,
    MixinStake,
    MixinExchangeFees
{
    // this contract can receive ETH
    // solhint-disable no-empty-blocks
    function ()
        external
        payable
    {}

    /// @dev Initialize storage owned by this contract.
    ///      This function should not be called directly.
    ///      The StakingProxy contract will call it in `attachStakingContract()`.
    /// @param _wethProxyAddress The address that can transfer WETH for fees.
    /// @param _zrxVaultAddress Address of the ZrxVault contract.
    function init(
        address _wethProxyAddress,
        address _zrxVaultAddress
    )
        public
        onlyAuthorized
    {
        // DANGER! When performing upgrades, take care to modify this logic
        // to prevent accidentally clearing prior state.
        _initMixinScheduler();
        _initMixinParams(
            _wethProxyAddress,
            _zrxVaultAddress
        );
    }
}
