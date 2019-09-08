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


contract TestExchangeFees is
    Staking
{
    struct TestPool {
        uint256 stake;
        mapping(address => bool) isMaker;
    }

    mapping(bytes32 => TestPool) private _testPools;
    mapping(address => bytes32) private _makersToTestPoolIds;

    constructor(address exchangeAddress) public {
        validExchanges[exchangeAddress] = true;
        _initMixinParams();
    }

    /// @dev Create a test pool.
    function createTestPool(
        bytes32 poolId,
        uint256 stake,
        address[] memory makerAddresses
    )
        public
    {
        TestPool storage pool = _testPools[poolId];
        pool.stake = stake;
        for (uint256 i = 0; i < makerAddresses.length; ++i) {
            pool.isMaker[makerAddresses[i]] = true;
            _makersToTestPoolIds[makerAddresses[i]] = poolId;
        }
    }

    /// @dev Overridden to use test pools.
    function getStakingPoolIdOfMaker(address makerAddress)
        public
        view
        returns (bytes32)
    {
        return _makersToTestPoolIds[makerAddress];
    }

    /// @dev Overridden to use test pools.
    function getTotalStakeDelegatedToPool(bytes32 poolId)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        uint256 stake = _testPools[poolId].stake;
        return IStructs.StakeBalance({
            currentEpochBalance: stake,
            nextEpochBalance: stake
        });
    }
}
