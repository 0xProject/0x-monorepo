/*

  Copyright 2018 ZeroEx Intl.

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

pragma solidity ^0.5.5;


contract MixinDeploymentConstants {

    // @TODO SET THESE VALUES FOR DEPLOYMENT

    uint64 constant internal EPOCH_DURATION_IN_SECONDS = 1000;

    uint64 constant internal TIMELOCK_DURATION_IN_EPOCHS = 3;

    uint256 constant internal COBB_DOUGLAS_ALPHA_DENOMINATOR = 6;

    uint256 constant internal REWARD_PAYOUT_DELEGATED_STAKE_PERCENT_VALUE = 90;

    uint256 constant internal CHAIN_ID = 1;
}
