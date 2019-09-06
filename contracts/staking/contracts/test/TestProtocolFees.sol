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
import "../src/Staking.sol";


contract TestProtocolFees is
    Staking
{
    function setWethProxy(address wethProxyAddress)
        external
    {
        wethAssetProxy = IAssetProxy(wethProxyAddress);
    }

    function addMakerToPool(bytes32 poolId, address makerAddress)
        external
    {
        poolJoinedByMakerAddress[makerAddress].poolId = poolId;
        poolJoinedByMakerAddress[makerAddress].confirmed = true;
    }

    function getActivePoolsByEpoch()
        external
        view
        returns (bytes32[] memory)
    {
        return activePoolsThisEpoch;
    }
}
