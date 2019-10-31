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

import "../src/interfaces/IStructs.sol";
import "./TestStakingNoWETH.sol";


contract TestMixinStakingPoolRewards is
    TestStakingNoWETH
{
    event UpdateCumulativeReward(
        bytes32 poolId
    );

    struct UnfinalizedPoolReward {
        uint256 reward;
        uint256 membersStake;
    }

    constructor() public {
        _addAuthorizedAddress(msg.sender);
        init();
        _removeAuthorizedAddressAtIndex(msg.sender, 0);
    }

    // Rewards returned by `_computeMemberRewardOverInterval()`, indexed
    // by `_getMemberRewardOverIntervalHash()`.
    mapping (bytes32 => uint256) private _memberRewardsOverInterval;
    // Rewards returned by `_getUnfinalizedPoolRewards()`, indexed by pool ID.
    mapping (bytes32 => UnfinalizedPoolReward) private _unfinalizedPoolRewards;

    // Set the rewards returned by a call to `_computeMemberRewardOverInterval()`.
    function setMemberRewardsOverInterval(
        bytes32 poolId,
        uint256 memberStakeOverInterval,
        uint256 beginEpoch,
        uint256 endEpoch,
        uint256 reward
    )
        external
    {
        bytes32 rewardHash = _getMemberRewardOverIntervalHash(
            poolId,
            memberStakeOverInterval,
            beginEpoch,
            endEpoch
        );
        _memberRewardsOverInterval[rewardHash] = reward;
    }

    // Set the rewards returned by `_getUnfinalizedPoolRewards()`.
    function setUnfinalizedPoolRewards(
        bytes32 poolId,
        uint256 reward,
        uint256 membersStake
    )
        external
    {
        _unfinalizedPoolRewards[poolId] = UnfinalizedPoolReward(
            reward,
            membersStake
        );
    }

    // Advance the epoch.
    function advanceEpoch() external {
        currentEpoch += 1;
    }

    // Set `_delegatedStakeToPoolByOwner`
    function setDelegatedStakeToPoolByOwner(
        address member,
        bytes32 poolId,
        IStructs.StoredBalance memory balance
    )
        public
    {
        _delegatedStakeToPoolByOwner[member][poolId] = balance;
    }

    // Set `_poolById`.
    function setPool(
        bytes32 poolId,
        IStructs.Pool memory pool
    )
        public
    {
        _poolById[poolId] = pool;
    }

    // Overridden to use `_memberRewardsOverInterval`
    function _computeMemberRewardOverInterval(
        bytes32 poolId,
        uint256 memberStakeOverInterval,
        uint256 beginEpoch,
        uint256 endEpoch
    )
        internal
        view
        returns (uint256 reward)
    {
        bytes32 rewardHash = _getMemberRewardOverIntervalHash(
            poolId,
            memberStakeOverInterval,
            beginEpoch,
            endEpoch
        );
        return _memberRewardsOverInterval[rewardHash];
    }

    // Overridden to use `_unfinalizedPoolRewards`
    function _getUnfinalizedPoolRewards(
        bytes32 poolId
    )
        internal
        view
        returns (uint256 reward, uint256 membersStake)
    {
        (reward, membersStake) = (
            _unfinalizedPoolRewards[poolId].reward,
            _unfinalizedPoolRewards[poolId].membersStake
        );
    }

    // Overridden to revert if a pool has unfinalized rewards.
    function _assertPoolFinalizedLastEpoch(bytes32 poolId)
        internal
        view
    {
        require(
            _unfinalizedPoolRewards[poolId].membersStake == 0,
            "POOL_NOT_FINALIZED"
        );
    }

    // Overridden to just emit an event.
    function _updateCumulativeReward(bytes32 poolId)
        internal
    {
        emit UpdateCumulativeReward(poolId);
    }

    // Compute a hash to index `_memberRewardsOverInterval`
    function _getMemberRewardOverIntervalHash(
        bytes32 poolId,
        uint256 memberStakeOverInterval,
        uint256 beginEpoch,
        uint256 endEpoch
    )
        private
        pure
        returns (bytes32 rewardHash)
    {
        return keccak256(
            abi.encode(
                poolId,
                memberStakeOverInterval,
                beginEpoch,
                endEpoch
            )
        );
    }
}
