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
import "../libs/LibZrxToken.sol";
import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "./MixinStorage.sol";
import "./MixinConstants.sol";
import "../interfaces/IStakingEvents.sol";


contract MixinStake is
    SafeMath,
    IStakingEvents,
    MixinConstants,
    MixinStorage
{
    using LibZrxToken for uint256;

    // default maker id that stake is delegated to
    bytes32 constant internal NIL_MAKER_ID = 0x0;

    function _stake(uint256 amount)
        internal
        returns (uint256)
    {
        // sanitize input - can only stake whole tokens
        uint256 amountOfStakeToMint = amount._roundDownToNearestWholeToken();

        // deposit equivalent amount of ZRX into vault
        zrxVault.depositFrom(msg.sender, amountOfStakeToMint);

        // mint stake
        totalStake[msg.sender] = _safeAdd(totalStake[msg.sender], amountOfStakeToMint);
        delegatedStake[msg.sender][NIL_MAKER_ID] = _safeAdd(delegatedStake[msg.sender][NIL_MAKER_ID], amountOfStakeToMint);

        // emit stake event
        emit StakeMinted(
            msg.sender,
            amountOfStakeToMint
        );

        // return amount of stake minted
        return amountOfStakeToMint;
    }

    function _unstake(uint256 amount)
        internal
        returns (uint256)
    {
        // sanitize input - can only stake whole tokens
        uint256 amountOfStakeToBurn = amount._roundDownToNearestWholeToken();

        // burn stake
        totalStake[msg.sender] = _safeSub(totalStake[msg.sender], amountOfStakeToBurn);
        delegatedStake[msg.sender][NIL_MAKER_ID] = _safeSub(delegatedStake[msg.sender][NIL_MAKER_ID], amountOfStakeToBurn);

        // withdraw equivalent amount of ZRX from vault
        zrxVault.withdrawFrom(msg.sender, amountOfStakeToBurn);

        // emit stake event
        emit StakeMinted(
            msg.sender,
            amountOfStakeToBurn
        );

        // return amount of stake minted
        return amountOfStakeToBurn;
    }

    function _delegateStake(bytes32 makerId, uint256 amount)
        internal
        returns (uint256)
    {
        require(
            _getUndelegatedStake(msg.sender) >= amount,
            "INSUFFICIENT_STAKE_BALANCE"
        );

        // change from undelegated to delegated
        delegatedStake[msg.sender][NIL_MAKER_ID] = _safeSub(delegatedStake[msg.sender][NIL_MAKER_ID], amount);
        delegatedStake[msg.sender][makerId] = _safeAdd(delegatedStake[msg.sender][makerId], amount);

        // Update total stake delegated to `makerId`
        totalDelegatedStake[makerId] = _safeAdd(totalDelegatedStake[makerId], amount);
    }

    function _undelegateStake(bytes32 makerId, uint256 amount)
        internal
        returns (uint256)
    {
        require(
            _getStakeDelegatedByOwner(msg.sender, makerId) >= amount,
            "INSUFFICIENT_DELEGATED_STAKE_BALANCE"
        );

        // change from delegated to undelegated
        delegatedStake[msg.sender][makerId] = _safeSub(delegatedStake[msg.sender][makerId], amount);
        delegatedStake[msg.sender][NIL_MAKER_ID] = _safeAdd(delegatedStake[msg.sender][NIL_MAKER_ID], amount);

        // Update total stake delegated to `makerId`
        totalDelegatedStake[makerId] = _safeAdd(totalDelegatedStake[makerId], amount);
    }

    function _undelegateAllStake(bytes32 makerId)
        internal
        returns (uint256)
    {
        address owner = msg.sender;
        uint256 delegatedStakeBalance = _getStakeDelegatedByOwner(owner, makerId);
        return _undelegateStake(makerId, delegatedStakeBalance);
    }

    function _stakeAndDelegate(bytes32 makerId, uint256 amount)
        internal
        returns (uint256 amountOfStakeDelegated)
    {
        // mint stake
        uint256 amountOfStakeMinted = _stake(amount);

        // delegate stake to maker
        amountOfStakeDelegated = _delegateStake(makerId, amountOfStakeMinted);
        return amountOfStakeDelegated;
    }

    function _getUndelegatedStake(address owner)
        internal
        returns (uint256)
    {
        return delegatedStake[owner][NIL_MAKER_ID];
    }

    function _getStakeDelegatedByOwner(address owner, bytes32 makerId)
        internal
        returns (uint256)
    {
        return delegatedStake[owner][makerId];
    }

    function _getTotalStakeDelegatedByOwner(address owner)
        internal
        returns (uint256)
    {
        return _safeSub(
            totalStake[owner],
            delegatedStake[owner][NIL_MAKER_ID]
        );
    }

    function _getTotalStakeDelegatedToMaker(bytes32 makerId)
        internal
        returns (uint256)
    {
        return totalDelegatedStake[makerId];
    }

    function _getStakeBalance(address owner)
        internal
        view
        returns (uint256)
    {
        return totalStake[owner];
    }
}
