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

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetProxy.sol";
import "../src/interfaces/IStructs.sol";
import "../src/Staking.sol";


contract TestProtocolFees is
    Staking
{
    struct TestPool {
        uint256 operatorStake;
        uint256 membersStake;
        mapping(address => bool) isMaker;
    }

    mapping(bytes32 => TestPool) private _testPools;
    mapping(address => bytes32) private _makersToTestPoolIds;

    constructor(address exchangeAddress, address wethProxyAddress) public {
        validExchanges[exchangeAddress] = true;
        _initMixinParams(
            wethProxyAddress,
            address(1), // vault addresses must be non-zero
            address(1),
            address(1)
        );
    }

    function addMakerToPool(bytes32 poolId, address makerAddress)
        external
    {
        poolJoinedByMakerAddress[makerAddress].poolId = poolId;
        poolJoinedByMakerAddress[makerAddress].confirmed = true;
    }

    function getWethAssetData() external pure returns (bytes memory) {
        return WETH_ASSET_DATA;
    }

    /// @dev Create a test pool.
    function createTestPool(
        bytes32 poolId,
        uint256 operatorStake,
        uint256 membersStake,
        address[] memory makerAddresses
    )
        public
    {
        TestPool storage pool = _testPools[poolId];
        pool.operatorStake = operatorStake;
        pool.membersStake = membersStake;
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
        TestPool memory pool = _testPools[poolId];
        uint256 stake = pool.operatorStake + pool.membersStake;
        return IStructs.StakeBalance({
            currentEpochBalance: stake,
            nextEpochBalance: stake
        });
    }

    /// @dev Overridden to use test pools.
    function getStakeDelegatedToPoolByOwner(address, bytes32 poolId)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        TestPool memory pool = _testPools[poolId];
        return IStructs.StakeBalance({
            currentEpochBalance: pool.operatorStake,
            nextEpochBalance: pool.operatorStake
        });
    }
}
