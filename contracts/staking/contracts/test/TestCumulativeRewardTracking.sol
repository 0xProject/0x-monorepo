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


// solhint-disable no-empty-blocks
contract TestCumulativeRewardTracking is
    TestStaking
{
    event SetCumulativeReward(
        bytes32 poolId,
        uint256 epoch
    );

    constructor(
        address wethAddress,
        address zrxVaultAddress
    )
        public
        TestStaking(
            wethAddress,
            zrxVaultAddress
        )
    {}

    function init() public {}

    function _addCumulativeReward(
        bytes32 poolId,
        uint256 reward,
        uint256 stake
    )
        internal
    {
        uint256 lastStoredEpoch = _cumulativeRewardsByPoolLastStored[poolId];
        MixinCumulativeRewards._addCumulativeReward(
            poolId,
            reward,
            stake
        );
        uint256 newLastStoredEpoch = _cumulativeRewardsByPoolLastStored[poolId];
        if (newLastStoredEpoch != lastStoredEpoch) {
            emit SetCumulativeReward(poolId, currentEpoch);
        }
    }
}
