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

import "./mixins/MConstants.sol";


contract MixinConstants is
    MConstants
{

    bytes4 constant internal ERC20_DATA_ID = bytes4(keccak256("ERC20Token(address)"));
    bytes4 constant internal ERC721_DATA_ID = bytes4(keccak256("ERC721Token(address,uint256,bytes)"));
    uint256 constant internal MAX_UINT = 2**256 - 1;
    uint256 constant internal PERCENTAGE_DENOMINATOR = 10**18; 
    uint256 constant internal MAX_FEE_PERCENTAGE = 5 * PERCENTAGE_DENOMINATOR / 100;         // 5%
    uint256 constant internal MAX_WETH_FILL_PERCENTAGE = 95 * PERCENTAGE_DENOMINATOR / 100;  // 95%
 
    constructor (
        address _exchange,
        address _etherToken,
        address _zrxToken,
        bytes memory _zrxAssetData,
        bytes memory _wethAssetData
    )
        public
    {
        EXCHANGE = IExchange(_exchange);
        ETHER_TOKEN = IEtherToken(_etherToken);
        ZRX_TOKEN = IERC20Token(_zrxToken);
        ZRX_ASSET_DATA = _zrxAssetData;
        WETH_ASSET_DATA = _wethAssetData;
    }
}
