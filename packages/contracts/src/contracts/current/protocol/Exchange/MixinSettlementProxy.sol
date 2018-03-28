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
    
    function settle(
        address token,
        address[] fromOwners,
        uint256[] fromAmounts,
        address[] toOwners,
        uint256[] toAmounts)
        internal
    {
        require(fromOwners.length == fromAmounts.length);
        require(toOwners.length == toAmounts.length);
        require(fromOwners.length > 0);
        require(toOwners.length > 0);
        
        uint256 fromIndex = 0;
        uint256 toIndex = 0;
        while(true) {
            
            // Transfer amount is bound by from balance
            if(fromAmounts[fromIndex] > toAmounts[toIndex]) {
                transfer(
                    token,
                    fromOwners[fromIndex],
                    toOwners[toIndex],
                    toAmounts[toIndex]);
                // toAmounts[toIndex] -= toAmounts[toIndex];
                fromAmounts[fromIndex] -= toAmounts[toIndex];
                toIndex += 1;
                require(toIndex < toOwners.length);
                
            // Transfer amount is bound by to balance
            } else { // fromAmounts[fromIndex] <= toAmounts[toIndex
                transfer(
                    token,
                    fromOwners[fromIndex],
                    toOwners[toIndex],
                    fromAmounts[fromIndex]);
                toAmounts[toIndex] -= fromAmounts[fromIndex];
                // fromAmounts[fromIndex] -= fromAmounts[fromIndex];
                fromIndex += 1;
                
                // Transfer settled both sides. This could mean all is settled.
                if(toAmounts[toIndex] == 0) {
                    // fromAmounts[fromIndex] == toAmounts[toIndex]
                    toIndex += 1;
                    if( toIndex == toOwners.length &&
                        fromIndex == fromOwners.length) {
                        return;
                    }
                    require(toIndex < toOwners.length);
                }
                require(fromIndex < toOwners.length);
            }
        }
    }
}
