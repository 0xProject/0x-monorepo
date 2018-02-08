/*

  Copyright 2017 ZeroEx Intl.

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

pragma solidity ^0.4.19;

import "./mixins/MSettlement.sol";
import "../TokenTransferProxy/ITokenTransferProxy.sol";
import "../../tokens/Token/IToken.sol";
import "./LibPartialAmount.sol";

/// @dev Provides MixinSettlement
contract MixinSettlementProxy is
    MSettlement,
    LibPartialAmount
{

    address public TOKEN_TRANSFER_PROXY_CONTRACT;
    
    address public ZRX_TOKEN_CONTRACT;
    
    function MixinSettlementProxy(address proxyContract, address zrxToken)
        public
    {
        ZRX_TOKEN_CONTRACT = zrxToken;
        TOKEN_TRANSFER_PROXY_CONTRACT = proxyContract;
    }
    
    function settleOrder(
        Order order,
        address taker,
        uint256 takerTokenFilledAmount)
        internal
        returns (
            uint256 makerTokenFilledAmount,
            uint256 makerFeePaid,
            uint256 takerFeePaid
        )
    {
        makerTokenFilledAmount = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.makerTokenAmount);
        require(transferViaTokenTransferProxy(
            order.makerToken,
            order.maker,
            taker,
            makerTokenFilledAmount
        ));
        require(transferViaTokenTransferProxy(
            order.takerToken,
            taker,
            order.maker,
            takerTokenFilledAmount
        ));
        if (order.feeRecipient != address(0)) {
            if (order.makerFee > 0) {
                makerFeePaid = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.makerFee);
                require(transferViaTokenTransferProxy(
                    ZRX_TOKEN_CONTRACT,
                    order.maker,
                    order.feeRecipient,
                    makerFeePaid
                ));
            }
            if (order.takerFee > 0) {
                takerFeePaid = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.takerFee);
                require(transferViaTokenTransferProxy(
                    ZRX_TOKEN_CONTRACT,
                    taker,
                    order.feeRecipient,
                    takerFeePaid
                ));
            }
        }
        return (makerTokenFilledAmount, makerFeePaid, takerFeePaid);
    }

    /// @dev Transfers a token using TokenTransferProxy transferFrom function.
    /// @param token Address of token to transferFrom.
    /// @param from Address transfering token.
    /// @param to Address receiving token.
    /// @param value Amount of token to transfer.
    /// @return Success of token transfer.
    function transferViaTokenTransferProxy(
        address token,
        address from,
        address to,
        uint256 value)
        internal
        returns (bool success)
    {
        success = ITokenTransferProxy(TOKEN_TRANSFER_PROXY_CONTRACT).transferFrom(token, from, to, value);
        return success;
    }

}
