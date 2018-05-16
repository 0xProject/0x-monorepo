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

import "./mixins/MSettlement.sol";
import "./mixins/MAssetProxyDispatcher.sol";
import "./libs/LibOrder.sol";
import "./libs/LibMath.sol";
import "./libs/LibExchangeErrors.sol";
import "./libs/LibFillResults.sol";
import "./mixins/MMatchOrders.sol";

contract MixinSettlement is
    LibMath,
    LibFillResults,
    LibExchangeErrors,
    MMatchOrders,
    MSettlement,
    MAssetProxyDispatcher
{
    // ZRX metadata used for fee transfers.
    // This will be constant throughout the life of the Exchange contract,
    // since ZRX will always be transferred via the ERC20 AssetProxy.
    bytes internal ZRX_PROXY_DATA;

    /// @dev Gets the ZRX metadata used for fee transfers.
    function zrxProxyData()
        external
        view
        returns (bytes memory)
    {
        return ZRX_PROXY_DATA;
    }

    /// TODO: _zrxProxyData should be a constant in production.
    /// @dev Constructor sets the metadata that will be used for paying ZRX fees.
    /// @param _zrxProxyData Byte array containing ERC20 proxy id concatenated with address of ZRX.
    constructor (bytes memory _zrxProxyData)
        public
    {
        ZRX_PROXY_DATA = _zrxProxyData;
    }

    /// @dev Settles an order by transferring assets between counterparties.
    /// @param order Order struct containing order specifications.
    /// @param takerAddress Address selling takerAsset and buying makerAsset.
    /// @param fillResults Amounts to be filled and fees paid by maker and taker.
    function settleOrder(
        LibOrder.Order memory order,
        address takerAddress,
        FillResults memory fillResults
    )
        internal
    {
        dispatchTransferFrom(
            order.makerAssetData,
            order.makerAddress,
            takerAddress,
            fillResults.makerAssetFilledAmount
        );
        dispatchTransferFrom(
            order.takerAssetData,
            takerAddress,
            order.makerAddress,
            fillResults.takerAssetFilledAmount
        );
        dispatchTransferFrom(
            ZRX_PROXY_DATA,
            order.makerAddress,
            order.feeRecipientAddress,
            fillResults.makerFeePaid
        );
        dispatchTransferFrom(
            ZRX_PROXY_DATA,
            takerAddress,
            order.feeRecipientAddress,
            fillResults.takerFeePaid
        );
    }

    /// @dev Settles matched order by transferring appropriate funds between order makers, taker, and fee recipient.
    /// @param leftOrder First matched order.
    /// @param rightOrder Second matched order.
    /// @param takerAddress Address that matched the orders. The taker receives the spread between orders as profit.
    /// @param matchedFillResults Struct holding amounts to transfer between makers, taker, and fee recipients.
    function settleMatchedOrders(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        address takerAddress,
        MatchedFillResults memory matchedFillResults
    )
        internal
    {
        // Order makers and taker
        dispatchTransferFrom(
            leftOrder.makerAssetData,
            leftOrder.makerAddress,
            rightOrder.makerAddress,
            matchedFillResults.right.takerAssetFilledAmount
        );
        dispatchTransferFrom(
            rightOrder.makerAssetData,
            rightOrder.makerAddress,
            leftOrder.makerAddress,
            matchedFillResults.left.takerAssetFilledAmount
        );
        dispatchTransferFrom(
            leftOrder.makerAssetData,
            leftOrder.makerAddress,
            takerAddress,
            matchedFillResults.takerFillAmount
        );

        // Maker fees
        dispatchTransferFrom(
            ZRX_PROXY_DATA,
            leftOrder.makerAddress,
            leftOrder.feeRecipientAddress,
            matchedFillResults.left.makerFeePaid
        );
        dispatchTransferFrom(
            ZRX_PROXY_DATA,
            rightOrder.makerAddress,
            rightOrder.feeRecipientAddress,
            matchedFillResults.right.makerFeePaid
        );

        // Taker fees
        if (leftOrder.feeRecipientAddress == rightOrder.feeRecipientAddress) {
            dispatchTransferFrom(
                ZRX_PROXY_DATA,
                takerAddress,
                leftOrder.feeRecipientAddress,
                safeAdd(
                    matchedFillResults.left.takerFeePaid,
                    matchedFillResults.right.takerFeePaid
                )
            );
        } else {
            dispatchTransferFrom(
                ZRX_PROXY_DATA,
                takerAddress,
                leftOrder.feeRecipientAddress,
                matchedFillResults.left.takerFeePaid
            );
            dispatchTransferFrom(
                ZRX_PROXY_DATA,
                takerAddress,
                rightOrder.feeRecipientAddress,
                matchedFillResults.right.takerFeePaid
            );
        }
    }
}
