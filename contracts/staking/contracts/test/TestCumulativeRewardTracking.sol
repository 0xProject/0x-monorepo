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
            address(0),
            zrxVaultAddress
        )
    {}

    function init() public {}

    function _forceSetCumulativeReward(
        bytes32 poolId,
        IStructs.Fraction memory value
    )
        internal
    {
        emit SetCumulativeReward(poolId, currentEpoch);
        MixinCumulativeRewards._forceSetCumulativeReward(
            poolId,
            value
        );
    }
}
