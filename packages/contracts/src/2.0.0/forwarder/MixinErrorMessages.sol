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

// solhint-disable
pragma solidity 0.4.24;


/// This contract is intended to serve as a reference, but is not actually used for efficiency reasons.
contract MixinErrorMessages {
    string constant VALUE_GREATER_THAN_ZERO = "VALUE_GREATER_THAN_ZERO";
    string constant FEE_PROPORTION_TOO_LARGE = "FEE_PROPORTION_TOO_LARGE";
    string constant TAKER_ASSET_ZRX_REQUIRED = "TAKER_ASSET_ZRX_REQUIRED";
    string constant TAKER_ASSET_WETH_REQUIRED = "TAKER_ASSET_WETH_REQUIRED";
    string constant SAME_ASSET_TYPE_REQUIRED = "SAME_ASSET_TYPE_REQUIRED";
    string constant UNACCEPTABLE_THRESHOLD = "UNACCEPTABLE_THRESHOLD";
    string constant UNSUPPORTED_TOKEN_PROXY = "UNSUPPORTED_TOKEN_PROXY";
    string constant ASSET_AMOUNT_MATCH_ORDER_SIZE = "ASSET_AMOUNT_MUST_MATCH_ORDER_SIZE";
    string constant DEFAULT_FUNCTION_WETH_CONTRACT_ONLY = "DEFAULT_FUNCTION_WETH_CONTRACT_ONLY";
    string constant INVALID_MSG_VALUE = "INVALID_MSG_VALUE";
}
