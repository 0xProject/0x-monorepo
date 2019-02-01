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

import "./IExchangeCore.sol";
import "./IMatchOrders.sol";
import "./ISignatureValidator.sol";
import "./ITransactions.sol";
import "./IAssetProxyDispatcher.sol";
import "./IWrapperFunctions.sol";


// solhint-disable no-empty-blocks
contract IExchange is
    IExchangeCore,
    IMatchOrders,
    ISignatureValidator,
    ITransactions,
    IAssetProxyDispatcher,
    IWrapperFunctions
{}
