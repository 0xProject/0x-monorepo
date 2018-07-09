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

import "../../protocol/Exchange/interfaces/IExchange.sol";
import "../../tokens/EtherToken/IEtherToken.sol";
import "../../tokens/ERC20Token/IERC20Token.sol";


contract MConstants {

    // solhint-disable var-name-mixedcase
    IExchange internal EXCHANGE;
    IEtherToken internal ETHER_TOKEN;
    IERC20Token internal ZRX_TOKEN;
    bytes internal ZRX_ASSET_DATA;
    bytes internal WETH_ASSET_DATA;
    // solhint-enable var-name-mixedcase
}
