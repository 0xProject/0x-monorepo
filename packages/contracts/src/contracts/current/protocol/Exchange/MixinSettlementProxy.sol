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
import "./LibPartialAmount.sol";
import "../AssetProxyDispatcher/IAssetProxy.sol";

/// @dev Provides MixinSettlement
contract MixinSettlementProxy is
    MSettlement,
    LibPartialAmount
{
    IAssetProxy ASSET_PROXY_DISPATCHER;
    bytes ZRX_PROXY_DATA;

    function assetProxyDispatcher()
        public view
        returns (IAssetProxy)
    {
        return ASSET_PROXY_DISPATCHER;
    }

    function zrxProxyData()
        external view
        returns (bytes memory)
    {
        return ZRX_PROXY_DATA;
    }

    function MixinSettlementProxy(
        address _assetProxyDispatcher,
        bytes memory _zrxProxyData)
        public
    {
        ASSET_PROXY_DISPATCHER = IAssetProxy(_assetProxyDispatcher);
        ZRX_PROXY_DATA = _zrxProxyData;
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
        ASSET_PROXY_DISPATCHER.transferFrom(
            order.makerAssetData,
            order.makerAddress,
            takerAddress,
            makerTokenFilledAmount
        );
        ASSET_PROXY_DISPATCHER.transferFrom(
            order.takerAssetData,
            takerAddress,
            order.makerAddress,
            takerTokenFilledAmount
        );
        if (order.feeRecipientAddress != address(0)) {
            if (order.makerFee > 0) {
                makerFeePaid = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.makerFee);
                ASSET_PROXY_DISPATCHER.transferFrom(
                    ZRX_PROXY_DATA,
                    order.makerAddress,
                    order.feeRecipientAddress,
                    makerFeePaid
                );
            }
            if (order.takerFee > 0) {
                takerFeePaid = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.takerFee);
                ASSET_PROXY_DISPATCHER.transferFrom(
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
