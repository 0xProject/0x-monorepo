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

pragma solidity ^0.4.23;
pragma experimental ABIEncoderV2;

import "./mixins/MSettlement.sol";
import "./mixins/MAssetProxyDispatcher.sol";
import "./LibOrder.sol";
import "./LibMath.sol";
import "../AssetProxy/IAssetProxy.sol";

/// @dev Provides MixinSettlement
contract MixinSettlement is
    LibMath,
    MSettlement,
    MAssetProxyDispatcher
{
    bytes internal ZRX_PROXY_DATA;

    function zrxProxyData()
        external
        view
        returns (bytes memory)
    {
        return ZRX_PROXY_DATA;
    }

    constructor (bytes memory _zrxProxyData)
        public
    {
        ZRX_PROXY_DATA = _zrxProxyData;
    }

    function settleOrder(
        LibOrder.Order memory order,
        address takerAddress,
        uint256 takerAssetFilledAmount)
        internal
        returns (
            uint256 makerAssetFilledAmount,
            uint256 makerFeePaid,
            uint256 takerFeePaid
        )
    {
        makerAssetFilledAmount = getPartialAmount(takerAssetFilledAmount, order.takerAssetAmount, order.makerAssetAmount);
        dispatchTransferFrom(
            order.makerAssetData,
            order.makerAddress,
            takerAddress,
            makerAssetFilledAmount
        );
        dispatchTransferFrom(
            order.takerAssetData,
            takerAddress,
            order.makerAddress,
            takerAssetFilledAmount
        );
        makerFeePaid = getPartialAmount(takerAssetFilledAmount, order.takerAssetAmount, order.makerFee);
        dispatchTransferFrom(
            ZRX_PROXY_DATA,
            order.makerAddress,
            order.feeRecipientAddress,
            makerFeePaid
        );
        takerFeePaid = getPartialAmount(takerAssetFilledAmount, order.takerAssetAmount, order.takerFee);
        dispatchTransferFrom(
            ZRX_PROXY_DATA,
            takerAddress,
            order.feeRecipientAddress,
            takerFeePaid
        );
        return (makerAssetFilledAmount, makerFeePaid, takerFeePaid);
    }
}
