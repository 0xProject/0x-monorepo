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

import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "./MixinStorage.sol";


contract MixinStake is
    SafeMath,
    MixinStorage
{


contract MixinTimelock {

    // Epoch | lockedAt  | total | pending | current | timelock() | withdraw() | available()
    // 0     | 0         | 0     | 0       | 0       |            |            | 0
    // 1     | 1         | 5     | 0       | 0       | +5         |            | 0
    // 2     | 1         | 5     | 0       | 0       |            |            | 0
    // 2     | 2         | 15    | 5       | 0       | +10        |            | 0
    // 3     | 2         | 15    | 5       | 0       |            |            | 5
    // 3     | 3         | 30    | 15      | 5       | +15        |            | 5
    // 4     | 3         | 30    | 15      | 5       |            |            | 15
    // 5     | 3         | 30    | 15      | 5       |            |            | 30
    // 5     | 5         | 30    | 30      | 30      | +0 *       |            | 30
    // 6     | 6         | 50    | 30      | 30      | +20        |            | 30
    // 6     | 6         | 20    | 0       | 0       |            | -30        | 0
    // 7     | 6         | 20    | 0       | 0       |            |            | 0
    // 8     | 6         | 20    | 0       | 0       |            |            | 20

    function _timelockStake()
}