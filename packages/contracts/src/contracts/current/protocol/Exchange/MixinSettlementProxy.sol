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
import "../../tokens/Token/IToken.sol";
import "./LibPartialAmount.sol";
import "../AssetProxyDispatcher/IAssetProxy.sol";

/// @dev Provides MixinSettlement
contract MixinSettlementProxy is
    MSettlement,
    LibPartialAmount
{
    IAssetProxy TRANSFER_PROXY;
    // TODO: Is there a way to encode ZRX_PROXY_DATA into takerAssetData/makerAssetData?
    //       As it stands, only one of the ERC20 proxies can be used.
    bytes ZRX_PROXY_DATA;
    IToken ZRX_TOKEN;

    function transferProxy()
        public view
        returns (IAssetProxy)
    {
        return TRANSFER_PROXY;
    }

    function zrxToken()
        external view
        returns (IToken)
    {
        return ZRX_TOKEN;
    }

    function zrxProxyData()
        external view
        returns (bytes)
    {
        return ZRX_PROXY_DATA;
    }

    function MixinSettlementProxy(
        IAssetProxy assetProxyDispatcherContract,
        IToken zrxToken,
        bytes zrxProxyData)
        public
    {
        ZRX_TOKEN = zrxToken;
        TRANSFER_PROXY = assetProxyDispatcherContract;
        ZRX_PROXY_DATA = zrxProxyData;
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
        TRANSFER_PROXY.transferFrom(
            order.makerAssetData,
            order.makerAddress,
            takerAddress,
            makerTokenFilledAmount
        );
        TRANSFER_PROXY.transferFrom(
            order.takerAssetData,
            takerAddress,
            order.makerAddress,
            takerTokenFilledAmount
        );
        if (order.feeRecipientAddress != address(0)) {
            if (order.makerFee > 0) {
                makerFeePaid = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.makerFee);
                TRANSFER_PROXY.transferFrom(
                    ZRX_PROXY_DATA,
                    order.makerAddress,
                    order.feeRecipientAddress,
                    makerFeePaid
                );
            }
            if (order.takerFee > 0) {
                takerFeePaid = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.takerFee);
                TRANSFER_PROXY.transferFrom(
                    ZRX_PROXY_DATA,
                    takerAddress,
                    order.feeRecipientAddress,
                    takerFeePaid
                );
            }
        }
        return (makerTokenFilledAmount, makerFeePaid, takerFeePaid);
    }
}
