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


contract MixinConstants {

    uint256 constant TOKEN_MULTIPLIER = 10**18;

    bytes32 constant INITIAL_MAKER_ID = 0x0000000000000000000000000000000080000000000000000000000000000000;

    bytes32 constant public NIL_MAKER_ID = 0x0000000000000000000000000000000000000000000000000000000000000000;

    address constant public NIL_ADDRESS = 0x0000000000000000000000000000000000000000;

    
}
