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

pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "../../../protocol/Exchange/interfaces/IExchange.sol";
import "../interfaces/IThresholdAsset.sol";


contract MBalanceThresholdFilterCore {

    IExchange internal EXCHANGE;
    IThresholdAsset internal THRESHOLD_ASSET;

    event ValidatedAddresses (
        address[] addresses
    );

    function executeTransaction(
        uint256 salt,
        address signerAddress,
        bytes signedExchangeTransaction,
        bytes signature
    ) 
        external;

    function validateBalanceThresholdsOrRevert() internal;
}