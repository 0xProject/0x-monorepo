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

import "./TestStaking.sol";


contract TestMixinCumulativeRewards is
    TestStaking
{

    constructor(
        address wethAddress,
        address zrxVaultAddress
    )
        public
        TestStaking(
            wethAddress,
            zrxVaultAddress
        )
    {
        _addAuthorizedAddress(msg.sender);
        init();
        _removeAuthorizedAddressAtIndex(msg.sender, 0);
    }

    /// @dev Exposes `_isCumulativeRewardSet`
    function isCumulativeRewardSet(IStructs.Fraction memory cumulativeReward)
        public
        pure
        returns (bool)
    {
        return _isCumulativeRewardSet(cumulativeReward);
    }

    /// @dev Exposes `_addCumulativeReward`
    function addCumulativeReward(
        bytes32 poolId,
        uint256 reward,
        uint256 stake
    )
        public
    {
        _addCumulativeReward(poolId, reward, stake);
    }

    /// @dev Exposes `_updateCumulativeReward`
    function updateCumulativeReward(bytes32 poolId)
        public
    {
        _updateCumulativeReward(poolId);
    }

    /// @dev Exposes _computeMemberRewardOverInterval
    function computeMemberRewardOverInterval(
        bytes32 poolId,
        uint256 memberStakeOverInterval,
        uint256 beginEpoch,
        uint256 endEpoch
    )
        public
        view
        returns (uint256 reward)
    {
        return _computeMemberRewardOverInterval(poolId, memberStakeOverInterval, beginEpoch, endEpoch);
    }

    /// @dev Increments current epoch by 1
    function incrementEpoch()
        public
    {
        currentEpoch += 1;
    }

    /// @dev Stores an arbitrary cumulative reward for a given epoch.
    ///      Also sets the `_cumulativeRewardsByPoolLastStored` to the input epoch.
    function storeCumulativeReward(
        bytes32 poolId,
        IStructs.Fraction memory cumulativeReward,
        uint256 epoch
    )
        public
    {
        _cumulativeRewardsByPool[poolId][epoch] = cumulativeReward;
        _cumulativeRewardsByPoolLastStored[poolId] = epoch;
    }

    /// @dev Returns the raw cumulative reward for a given pool in an epoch.
    ///      This is considered "raw" because the internal implementation
    ///      (_getCumulativeRewardAtEpochRaw) will query other state variables
    ///      to determine the most accurate cumulative reward for a given epoch.
    function getCumulativeRewardAtEpochRaw(bytes32 poolId, uint256 epoch)
        public
        returns (IStructs.Fraction memory)
    {
        return  _cumulativeRewardsByPool[poolId][epoch];
    }
}
