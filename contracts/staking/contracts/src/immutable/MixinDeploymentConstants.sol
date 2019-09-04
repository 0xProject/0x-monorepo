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
}
