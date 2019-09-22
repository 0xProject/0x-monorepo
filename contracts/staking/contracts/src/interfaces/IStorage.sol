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
import "../interfaces/IZrxVault.sol";
import "../interfaces/IOperatorRewardVault.sol";
import "../interfaces/IMemberRewardVault.sol";
import "../interfaces/IStructs.sol";


interface IStorage {

    function wethAssetProxy()
        external
        view
        returns (IAssetProxy);

    function stakingContract()
        external
        view
        returns (address);

    function readOnlyProxy()
        external
        view
        returns (address);

    function readOnlyProxyCallee()
        external
        view
        returns (address);

    function nextPoolId()
        external
        view
        returns (bytes32);

    function poolJoinedByMakerAddress(address makerAddress)
        external
        view
        returns (IStructs.MakerPoolJoinStatus memory);

    function numMakersByPoolId(bytes32 poolId)
        external
        view
        returns (uint256);

    function currentEpoch()
        external
        view
        returns (uint256);

    function currentEpochStartTimeInSeconds()
        external
        view
        returns (uint256);

    function protocolFeesThisEpochByPool(bytes32 poolId)
        external
        view
        returns (uint256);

    function activePoolsThisEpoch()
        external
        view
        returns (bytes32[] memory);

    function validExchanges(address exchangeAddress)
        external
        view
        returns (bool);

    function zrxVault()
        external
        view
        returns (IZrxVault);

    function operatorRewardVault()
        external
        view
        returns (IOperatorRewardVault);

    function memberRewardVault()
        external
        view
        returns (IMemberRewardVault);

    function epochDurationInSeconds()
        external
        view
        returns (uint256);

    function rewardDelegatedStakeWeight()
        external
        view
        returns(uint32);

    function minimumPoolStake()
        external
        view
        returns (uint256);

    function maximumMakersInPool()
        external
        view
        returns(uint256);

    function cobbDouglasAlphaNumerator()
        external
        view
        returns (uint32);

    function cobbDouglasAlphaDenominator()
        external
        view
        returns (uint32);
}
