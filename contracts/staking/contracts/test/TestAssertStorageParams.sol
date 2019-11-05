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


// solhint-disable no-empty-blocks
contract TestAssertStorageParams is
    StakingProxy
{
    struct StorageParams {
        uint256 epochDurationInSeconds;
        uint32 rewardDelegatedStakeWeight;
        uint256 minimumPoolStake;
        uint32 cobbDouglasAlphaNumerator;
        uint32 cobbDouglasAlphaDenominator;
    }

    constructor()
        public
        StakingProxy(NIL_ADDRESS)
    {}

    function setAndAssertParams(StorageParams memory params)
        public
    {
        epochDurationInSeconds = params.epochDurationInSeconds;
        rewardDelegatedStakeWeight = params.rewardDelegatedStakeWeight;
        minimumPoolStake = params.minimumPoolStake;
        cobbDouglasAlphaNumerator = params.cobbDouglasAlphaNumerator;
        cobbDouglasAlphaDenominator = params.cobbDouglasAlphaDenominator;
        assertValidStorageParams();
    }

    function _attachStakingContract(address)
        internal
    {}
}
