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
        ITokenTransferProxy _proxyContract,
        IToken _zrxToken)
        public
    {
        ZRX_TOKEN = _zrxToken;
        TRANSFER_PROXY = _proxyContract;
    }

    function settleOrder(
        Order memory order,
        address takerAddress,
        uint256 takerTokenFilledAmount)
        internal
        returns (
            uint256 makerTokenFilledAmount,
            uint256 makerFeePaid,
            uint256 takerFeePaid
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
            if (order.makerFee > 0) {
                makerFeePaid = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.makerFee);
                require(
                    TRANSFER_PROXY.transferFrom(
                        ZRX_TOKEN,
                        order.makerAddress,
                        order.feeRecipientAddress,
                        makerFeePaid
                    )
                );
            }
            if (order.takerFee > 0) {
                takerFeePaid = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.takerFee);
                require(
                    TRANSFER_PROXY.transferFrom(
                        ZRX_TOKEN,
                        takerAddress,
                        order.feeRecipientAddress,
                        takerFeePaid
                    )
                );
            }
        }
        return (makerTokenFilledAmount, makerFeePaid, takerFeePaid);
    }
}
