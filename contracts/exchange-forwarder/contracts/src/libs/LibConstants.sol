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

import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";


contract LibConstants {

    using LibBytes for bytes;

    bytes4 constant internal ERC20_DATA_ID = bytes4(keccak256("ERC20Token(address)"));
    bytes4 constant internal ERC721_DATA_ID = bytes4(keccak256("ERC721Token(address,uint256)"));
    uint256 constant internal MAX_UINT = 2**256 - 1;
    uint256 constant internal PERCENTAGE_DENOMINATOR = 10**18;
    uint256 constant internal MAX_FEE_PERCENTAGE = 5 * PERCENTAGE_DENOMINATOR / 100;         // 5%
    uint256 constant internal MAX_WETH_FILL_PERCENTAGE = 95 * PERCENTAGE_DENOMINATOR / 100;  // 95%

     // solhint-disable var-name-mixedcase
    IExchange internal EXCHANGE;
    IEtherToken internal ETHER_TOKEN;
    IERC20Token internal ZRX_TOKEN;
    bytes internal ZRX_ASSET_DATA;
    bytes internal WETH_ASSET_DATA;
    // solhint-enable var-name-mixedcase

    constructor (
        address _exchange,
        bytes memory _zrxAssetData,
        bytes memory _wethAssetData
    )
        public
    {
        EXCHANGE = IExchange(_exchange);
        ZRX_ASSET_DATA = _zrxAssetData;
        WETH_ASSET_DATA = _wethAssetData;

        address etherToken = _wethAssetData.readAddress(16);
        address zrxToken = _zrxAssetData.readAddress(16);
        ETHER_TOKEN = IEtherToken(etherToken);
        ZRX_TOKEN = IERC20Token(zrxToken);
    }
}
