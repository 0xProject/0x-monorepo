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

import "../src/Staking.sol";
import "../src/interfaces/IStructs.sol";


contract TestCumulativeRewardTracking is
    Staking
{

    struct CumulativeReward {
        bytes32 poolId;
        uint256 epoch;
        IStructs.Fraction value;
    }

    function initializeTest(
        address staker,
        bytes32 poolId,
        IStructs.StoredBalance memory stakerDelegatedToPoolBalance,
        CumulativeReward[] memory initCumulativeRewards,
        uint256 mostRecentCumulativeRewardEpoch
    )
        public
    {
        delegatedStakeByOwner[staker] = stakerDelegatedToPoolBalance;
        delegatedStakeToPoolByOwner[staker][poolId] = stakerDelegatedToPoolBalance;

        for (uint i = 0; i != initCumulativeRewards.length; ++i) {
            MixinCumulativeRewards._setCumulativeReward(
                initCumulativeRewards[i].poolId,
                initCumulativeRewards[i].epoch,
                initCumulativeRewards[i].value
            );
        }

        MixinCumulativeRewards._setMostRecentCumulativeReward(poolId, mostRecentCumulativeRewardEpoch);
    }

    event SetMostRecentCumulativeReward(
        bytes32 poolId,
        uint256 epoch
    );

    event UnsetCumulativeReward(
        bytes32 poolId,
        uint256 epoch
    );

    event SetCumulativeReward(
        bytes32 poolId,
        uint256 epoch,
        IStructs.Fraction value
    );

    function _setMostRecentCumulativeReward(bytes32 poolId, uint256 epoch)
        internal
    {
        emit SetMostRecentCumulativeReward(poolId, epoch);
    }

    function _unsetCumulativeReward(bytes32 poolId, uint256 epoch)
        internal
    {
        emit UnsetCumulativeReward(poolId, epoch);
    }

    function _setCumulativeReward(bytes32 poolId, uint256 epoch, IStructs.Fraction memory value)
        internal
    {
        emit SetCumulativeReward(poolId, epoch, value);
    }
}
