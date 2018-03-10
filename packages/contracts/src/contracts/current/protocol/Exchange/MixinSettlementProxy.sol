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

    ITokenTransferProxy transferProxy;
    IToken zrxToken;
    
    function MixinSettlementProxy(
        ITokenTransferProxy _proxyContract,
        IToken _zrxToken
    )
        public
    {
        zrxToken = _zrxToken;
        transferProxy = _proxyContract;
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
            transferProxy.transferFrom(
                order.makerTokenAddress,
                order.makerAddress,
                takerAddress,
                makerTokenFilledAmount
            )
        );
        require(
            transferProxy.transferFrom(
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
                    transferProxy.transferFrom(
                        zrxToken,
                        order.makerAddress,
                        order.feeRecipientAddress,
                        makerFeeAmountPaid
                    )
                );
            }
            if (order.takerFeeAmount > 0) {
                takerFeeAmountPaid = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.takerFeeAmount);
                require(
                    transferProxy.transferFrom(
                        zrxToken,
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
