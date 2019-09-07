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


contract MixinDeploymentConstants {

    // @TODO SET THESE VALUES FOR DEPLOYMENT

    uint256 constant internal EPOCH_DURATION_IN_SECONDS = 1000;

    uint256 constant internal TIMELOCK_DURATION_IN_EPOCHS = 3;

    // How much delegated stake is weighted vs operator stake, in ppm.
    uint32 constant internal REWARD_DELEGATED_STAKE_WEIGHT = 900000; // 90%

    uint256 constant internal CHAIN_ID = 1;

    // Mainnet WETH9 Address
    address constant internal WETH_ADDRESS = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    // Kovan WETH9 Address
    // address constant internal WETH_ADDRESS = address(0xd0a1e359811322d97991e03f863a0c30c2cf029c);

    // Ropsten & Rinkeby WETH9 Address
    // address constant internal WETH_ADDRESS = address(0xc778417e063141139fce010982780140aa0cd5ab);

    // Mainnet Weth Asset Data
    bytes constant internal WETH_ASSET_DATA = hex"f47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

    // Kovan Weth Asset Data
    // bytes constant internal WETH_ASSET_DATA = hex"f47261b0000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c";

    // Ropsten & Rinkeby Weth Asset Data
    // bytes constant internal WETH_ASSET_DATA = hex"f47261b0000000000000000000000000c778417e063141139fce010982780140aa0cd5ab";
}
