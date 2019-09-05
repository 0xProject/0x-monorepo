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


contract TestStaking is
    Staking
{
    // Stub out `payProtocolFee` to be the naive payProtocolFee function so that tests will
    // not fail for WETH protocol fees.
    function payProtocolFee(
        address makerAddress,
        address,
        uint256
    )
        external
        payable
        onlyExchange
    {
        uint256 amount = msg.value;
        bytes32 poolId = getStakingPoolIdOfMaker(makerAddress);
        uint256 _feesCollectedThisEpoch = protocolFeesThisEpochByPool[poolId];
        protocolFeesThisEpochByPool[poolId] = _feesCollectedThisEpoch.safeAdd(amount);
        if (_feesCollectedThisEpoch == 0) {
            activePoolsThisEpoch.push(poolId);
        }
    }

    // Stub out `_unwrapWETH` to prevent the calls to `finalizeFees` from failing in tests
    // that do not relate to protocol fee payments in WETH.
    function _unwrapWETH()
        internal
    {} // solhint-disable-line no-empty-blocks
}
