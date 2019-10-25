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


contract TestMixinStakingPool is
    TestStakingNoWETH
{
    function setLastPoolId(bytes32 poolId)
        external
    {
        lastPoolId = poolId;
    }

    function setPoolIdByMaker(bytes32 poolId, address maker)
        external
    {
        poolIdByMaker[maker] = poolId;
    }

    // solhint-disable no-empty-blocks
    function testOnlyStakingPoolOperatorModifier(bytes32 poolId)
        external
        view
        onlyStakingPoolOperator(poolId)
    {}

    function setPoolById(bytes32 poolId, IStructs.Pool memory pool)
        public
    {
        _poolById[poolId] = pool;
    }
}
