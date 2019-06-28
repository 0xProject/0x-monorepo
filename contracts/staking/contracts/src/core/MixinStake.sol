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
    MixinTimelockedStake,
    MixinStakeBalances
{

    /// @dev This mixin contains logic for managing ZRX tokens and Stake.
    /// Stake is minted when ZRX is deposited and burned when ZRX is withdrawn.
    /// Stake can exist in one of many states:
    /// 1. Activated
    /// 2. Activated & Delegated
    /// 3. Deactivated & Timelocked
    /// 4. Deactivated & Withdrawable
    ///
    /// -- State Definitions --
    /// Activated Stake
    ///     Stake in this state can be used as a utility within the 0x ecosystem.
    ///     For example, it carries weight when computing fee-based rewards (see MixinExchangeFees).
    ///     In the future, it may be used to participate in the 0x governance system.
    ///
    /// Activated & Delegated Stake
    ///     Stake in this state also serves as a utility that is shared between the delegator and delegate.
    ///     For example, if delegated to a staking pool then it carries weight when computing fee-based rewards for
    ///     the staking pool; however, in this case, delegated stake carries less weight that regular stake (see MixinStakingPool).
    ///
    /// Deactivated & Timelocked Stake
    ///     Stake in this state cannot be used as a utility within the 0x ecosystem.
    ///     Stake is timelocked when it moves out of activated states (Activated / Activated & Delagated).
    ///     By limiting the portability of stake, we mitigate undesirable behavior such as switching staking pools
    ///     in the middle of an epoch.
    ///
    /// Deactivated & Withdrawable
    ///     Stake in this state cannot be used as a utility with in the 0x ecosystem.
    ///     This stake can, however, be burned and withdrawn as Zrx tokens.
    /// ----------------------------
    ///
    /// -- Valid State Transtions --
    /// Activated -> Deactivated & Timelocked
    /// 
    /// Activated & Delegated -> Deactivated & Timelocked
    ///
    /// Deactivated & Timelocked -> Deactivated & Withdrawable
    ///
    /// Deactivated & Withdrawable -> Activated
    /// Deactivated & Withdrawable -> Activated & Delegated
    /// Deactivated & Withdrawable -> Deactivated & Withdrawable
    /// ----------------------------
    ///
    /// Freshly minted stake is in the "Deactvated & Withdrawable" State, so it can
    /// either be activated, delegated or withdrawn.
    /// See MixinDelegatedStake and MixinTimelockedStake for more on respective state transitions.

    using LibSafeMath for uint256;

    /// @dev Deposit Zrx. This mints stake for the sender that is in the "Deactivated & Withdrawable" state.
    /// @param amount of Zrx to deposit / Stake to mint.
    function depositZrxAndMintDeactivatedStake(uint256 amount)
        external
    {
        _mintStake(msg.sender, amount);
    }

    /// @dev Deposit Zrx and mint stake in the activated stake.
    /// This is a convenience function, and can be used in-place of
    /// calling `depositZrxAndMintDeactivatedStake` and `activateStake`.
    /// This mints stake for the sender that is in the "Activated" state.
    /// @param amount of Zrx to deposit / Stake to mint.
    function depositZrxAndMintActivatedStake(uint256 amount)
        external
    {
        _mintStake(msg.sender, amount);
        activateStake(amount);
    }

    /// @dev Burns deactivated stake and withdraws the corresponding amount of Zrx.
    /// @param amount of Stake to burn / Zrx to withdraw
    function burnDeactivatedStakeAndWithdrawZrx(uint256 amount)
        external
    {
        address owner = msg.sender;
        _syncTimelockedStake(owner);
        require(
            amount <= getDeactivatedStake(owner),
            "INSUFFICIENT_BALANCE"
        );
        _burnStake(owner, amount);
    }

    /// @dev Activates stake that is presently in the Deactivated & Withdrawable state.
    /// @param amount of Stake to activate.
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

    /// @dev Deactivate & Timelock stake that is currently in the Activated state.
    /// @param amount of Stake to deactivate and timelock.
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
}
