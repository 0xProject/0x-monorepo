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

    function settleOrder(
        Order order,
        address takerAddress,
        uint256 takerTokenFilledAmount)
        internal
        returns (
            uint256 makerTokenFilledAmount,
            uint256 makerFeeAmountPaid,
            uint256 takerFeeAmountPaid
        )
    {
        makerTokenFilledAmount = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.makerTokenAmount);
        require(
            TRANSFER_PROXY.transferFrom(
                order.makerTokenAddress,
                order.makerAddress,
                takerAddress,
                makerTokenFilledAmount
            )
        );
        require(
            TRANSFER_PROXY.transferFrom(
                order.takerTokenAddress,
                takerAddress,
                order.makerAddress,
                takerTokenFilledAmount
            )
        );
        if (order.feeRecipientAddress != address(0)) {
            if (order.makerFeeAmount > 0) {
                makerFeeAmountPaid = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.makerFeeAmount);
                require(
                    TRANSFER_PROXY.transferFrom(
                        ZRX_TOKEN,
                        order.makerAddress,
                        order.feeRecipientAddress,
                        makerFeeAmountPaid
                    )
                );
            }
            if (order.takerFeeAmount > 0) {
                takerFeeAmountPaid = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.takerFeeAmount);
                require(
                    TRANSFER_PROXY.transferFrom(
                        ZRX_TOKEN,
                        takerAddress,
                        order.feeRecipientAddress,
                        takerFeeAmountPaid
                    )
                );
            }
        }
        return (makerTokenFilledAmount, makerFeeAmountPaid, takerFeeAmountPaid);
    }
}
