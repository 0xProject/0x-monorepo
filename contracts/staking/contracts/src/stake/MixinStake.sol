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

import "../libs/LibSafeMath.sol";
import "../libs/LibRewardMath.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStakingEvents.sol";
import "./MixinZrxVault.sol";
import "../staking_pools/MixinStakingPoolRewardVault.sol";
import "../sys/MixinScheduler.sol";
import "./MixinStakeBalances.sol";


/// @dev This mixin contains logic for managing ZRX tokens and Stake.
contract MixinStake is
    IStakingEvents,
    MixinDeploymentConstants,
    Ownable,
    MixinConstants,
    MixinStorage,
    MixinScheduler,
    MixinOwnable,
    MixinStakingPoolRewardVault,
    MixinZrxVault,
    MixinStakeBalances
{

    using LibSafeMath for uint256;

    /*

    /// @dev Deposit Zrx and mint stake in the activated stake.
    /// This is a convenience function, and can be used in-place of
    /// calling `depositZrxAndMintDeactivatedStake` and `activateStake`.
    /// This mints stake for the sender that is in the "Activated" state.
    /// @param amount of Zrx to deposit / Stake to mint.
    function mintStake(uint256 amount)
        external
    {
        _mintStake(msg.sender, amount);
        activateStake(amount);
    }

    function burnStake(uint256 amount)
        external
    {

        _burnStake(owner, amount);
    }

    /// @dev Burns deactivated stake and withdraws the corresponding amount of Zrx.
    /// @param amount of Stake to burn / Zrx to withdraw
    function burnDeactivatedStakeAndWithdrawZrx(uint256 amount)
        external
    {
        address owner = msg.sender;
        _syncTimeLockedStake(owner);
        require(
            amount <= getDeactivatedStake(owner),
            "INSUFFICIENT_BALANCE"
        );

    }

    /// @dev Activates stake that is presently in the Deactivated & Withdrawable state.
    /// @param amount of Stake to activate.
    function activateStake(uint256 amount)
        public
    {
        address owner = msg.sender;
        _syncTimeLockedStake(owner);
        require(
            amount <= getActivatableStake(owner),
            "INSUFFICIENT_BALANCE"
        );
        activatedStakeByOwner[owner] = activatedStakeByOwner[owner]._add(amount);
        totalActivatedStake = totalActivatedStake._add(amount);
    }

    /// @dev Deactivate & TimeLock stake that is currently in the Activated state.
    /// @param amount of Stake to deactivate and timeLock.
    function deactivateAndTimeLockStake(uint256 amount)
        public
    {
        address owner = msg.sender;
        _syncTimeLockedStake(owner);
        require(
            amount <= getActivatedStake(owner),
            "INSUFFICIENT_BALANCE"
        );
        activatedStakeByOwner[owner] = activatedStakeByOwner[owner]._sub(amount);
        totalActivatedStake = totalActivatedStake._sub(amount);
        _timeLockStake(owner, amount);
    }

    /// @dev Mints Stake in the Deactivated & Withdrawable state.
    /// @param owner to mint Stake for.
    /// @param amount of Stake to mint.
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

    /// @dev Burns Stake in the Deactivated & Withdrawable state.
    /// @param owner to mint Stake for.
    /// @param amount of Stake to mint.
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

    */
}
