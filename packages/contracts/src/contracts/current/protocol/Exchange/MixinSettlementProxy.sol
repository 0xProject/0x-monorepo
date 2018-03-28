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

pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./mixins/MSettlement.sol";
import "../TokenTransferProxy/ITokenTransferProxy.sol";
import "../../tokens/Token/IToken.sol";
import "./LibPartialAmount.sol";

/// @dev Provides MixinSettlement
contract MixinSettlementProxy is
    MSettlement,
    LibPartialAmount
{

    ITokenTransferProxy TRANSFER_PROXY;
    IToken ZRX_TOKEN;

    function transferProxy()
        external view
        returns (ITokenTransferProxy)
    {
        return TRANSFER_PROXY;
    }

    function zrxToken()
        external view
        returns (IToken)
    {
        return ZRX_TOKEN;
    }

    function MixinSettlementProxy(
        ITokenTransferProxy proxyContract,
        IToken zrxToken)
        public
    {
        ZRX_TOKEN = zrxToken;
        TRANSFER_PROXY = proxyContract;
    }
    
    function transfer(address token, address from, address to, uint256 amount)
        internal
    {
        if(amount > 0) {
            TRANSFER_PROXY.transferFrom(token, from, to, amount);
        }
    }
    
    function transferFee(address from, address to, uint256 amount)
        internal
    {
        transfer(ZRX_TOKEN, from, to, amount);
    }
}
