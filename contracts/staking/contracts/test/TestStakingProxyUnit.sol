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

import "../src/StakingProxy.sol";


contract TestStakingProxyUnit is
    StakingProxy
{
    // Storage Params - these are tested by StakingProxy.assertValidStorageParams.
    struct TestStorageParams {
        uint256 epochDurationInSeconds;
        uint32 cobbDouglasAlphaNumerator;
        uint32 cobbDouglasAlphaDenominator;
        uint32 rewardDelegatedStakeWeight;
        uint256 minimumPoolStake;
    }

    // If this is set then the `init` call will revert in the `TestProxyDestination` contract
    bool public initFailFlag;

    // solhint-disable no-empty-blocks
    constructor(address _stakingContract)
        public
        StakingProxy( _stakingContract)
    {}

    // Setters to modify the
    function setInitFailFlag()
        external
    {
        initFailFlag = true;
    }

    /// @dev Sets storage params with test values
    function setTestStorageParams(TestStorageParams calldata params)
        external
    {
        epochDurationInSeconds = params.epochDurationInSeconds;
        cobbDouglasAlphaNumerator = params.cobbDouglasAlphaNumerator;
        cobbDouglasAlphaDenominator = params.cobbDouglasAlphaDenominator;
        rewardDelegatedStakeWeight = params.rewardDelegatedStakeWeight;
        minimumPoolStake = params.minimumPoolStake;
    }
}
