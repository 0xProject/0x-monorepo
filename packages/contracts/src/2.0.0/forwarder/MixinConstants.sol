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

pragma solidity ^0.4.24;

import "../protocol/Exchange/Exchange.sol";
import { WETH9 as EtherToken } from "../tokens/WETH9/WETH9.sol";
import "../tokens/ERC20Token/IERC20Token.sol";

contract MixinConstants {

    Exchange EXCHANGE;
    EtherToken ETHER_TOKEN;
    IERC20Token ZRX_TOKEN;
    bytes ZRX_ASSET_DATA;
    bytes WETH_ASSET_DATA;

    constructor (
        address _exchange,
        address _etherToken,
        address _zrxToken,
        bytes memory _zrxAssetData,
        bytes memory _wethAssetData
    )
        public
    {
        EXCHANGE = Exchange(_exchange);
        ETHER_TOKEN = EtherToken(_etherToken);
        ZRX_TOKEN = IERC20Token(_zrxToken);
        ZRX_ASSET_DATA = _zrxAssetData;
        WETH_ASSET_DATA = _wethAssetData;
    }

}