/*

  Copyright 2019 ZeroEx Intl.

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

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-forwarder/contracts/src/libs/LibAssetDataTransfer.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "@0x/contracts-utils/contracts/src/Refundable.sol";
import "./interfaces/IBroker.sol";
import "./interfaces/IPropertyValidator.sol";
import "./libs/LibBrokerRichErrors.sol";


// solhint-disable space-after-comma
contract Broker is
    Refundable,
    IBroker
{
    bytes[] internal _cachedAssetData;
    uint256 internal _cacheIndex;
    address internal _sender;
    address internal _EXCHANGE; // solhint-disable-line var-name-mixedcase

    using LibSafeMath for uint256;
    using LibBytes for bytes;
    using LibAssetDataTransfer for bytes;

    /// @param exchange Address of the 0x Exchange contract.
    constructor (address exchange)
        public
    {
        _EXCHANGE = exchange;
    }

    /// @dev A payable fallback function that makes this contract "payable". This is necessary to allow
    ///      this contract to gracefully handle refunds from the Exchange.
    function ()
        external
        payable
    {} // solhint-disable-line no-empty-blocks

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata /* ids */,
        uint256[] calldata amounts,
        bytes calldata data
    )
        external
    {
        if (from != address(this)) {
            LibRichErrors.rrevert(
                LibBrokerRichErrors.InvalidFromAddressError(from)
            );
        }
        if (amounts.length != 1) {
            LibRichErrors.rrevert(
                LibBrokerRichErrors.AmountsLengthMustEqualOneError(amounts.length)
            );
        }
        uint256 remainingAmount = amounts[0];
        if (_cachedAssetData.length.safeSub(_cacheIndex) < remainingAmount) {
            LibRichErrors.rrevert(
                LibBrokerRichErrors.TooFewBrokerAssetsProvidedError(_cachedAssetData.length)
            );
        }

        while (remainingAmount != 0) {
            bytes memory assetToTransfer = _cachedAssetData[_cacheIndex];
            _cacheIndex++;

            // Decode validator and params from `data`
            (address validator, bytes memory propertyData) = abi.decode(
                data,
                (address, bytes)
            );

            // Execute staticcall
            (bool success, bytes memory returnData) = validator.staticcall(abi.encodeWithSelector(
                IPropertyValidator(0).checkBrokerAsset.selector,
                assetToTransfer,
                propertyData
            ));

            // Revert with returned data if staticcall is unsuccessful
            if (!success) {
                assembly {
                    revert(add(returnData, 32), mload(returnData))
                }
            }

            // Perform the transfer
            assetToTransfer.transferERC721Token(
                _sender,
                to,
                1
            );

            remainingAmount--;
        }
    }

    function brokerTrade(
        bytes[] memory brokeredAssets,
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature,
        bytes4 fillFunctionSelector
    )
        public
        payable
        refundFinalBalance
        returns (LibFillResults.FillResults memory fillResults)
    {
        // Cache the taker-supplied asset data
        _cachedAssetData = brokeredAssets;
        // Cache the sender's address
        _sender = msg.sender;

        // Sanity-check the provided function selector
        if (
            fillFunctionSelector != IExchange(address(0)).fillOrder.selector &&
            fillFunctionSelector != IExchange(address(0)).fillOrKillOrder.selector
        ) {
            LibBrokerRichErrors.InvalidFunctionSelectorError(fillFunctionSelector);
        }


        // Perform the fill
        bytes memory fillCalldata = abi.encodeWithSelector(
            fillFunctionSelector,
            order,
            takerAssetFillAmount,
            signature
        );
        // solhint-disable-next-line avoid-call-value
        (bool didSucceed, bytes memory returnData) = _EXCHANGE.call.value(msg.value)(fillCalldata);
        if (didSucceed) {
            fillResults = abi.decode(returnData, (LibFillResults.FillResults));
        } else {
            assembly {
                revert(add(returnData, 32), mload(returnData))
            }
        }

        // Transfer maker asset to taker
        order.makerAssetData.transferOut(fillResults.makerAssetFilledAmount);

        // Clear storage
        delete _cachedAssetData;
        _cacheIndex = 0;
        _sender = address(0);

        return fillResults;
    }

    function batchBrokerTrade(
        bytes[] memory brokeredAssets,
        LibOrder.Order[] memory orders,
        uint256[] memory takerAssetFillAmounts,
        bytes[] memory signatures,
        bytes4 batchFillFunctionSelector
    )
        public
        payable
        refundFinalBalance
        returns (LibFillResults.FillResults[] memory fillResults)
    {
        // Cache the taker-supplied asset data
        _cachedAssetData = brokeredAssets;
        // Cache the sender's address
        _sender = msg.sender;

        // Sanity-check the provided function selector
        if (
            batchFillFunctionSelector != IExchange(address(0)).batchFillOrders.selector &&
            batchFillFunctionSelector != IExchange(address(0)).batchFillOrKillOrders.selector &&
            batchFillFunctionSelector != IExchange(address(0)).batchFillOrdersNoThrow.selector
        ) {
            LibBrokerRichErrors.InvalidFunctionSelectorError(batchFillFunctionSelector);
        }

        // Perform the batch fill
        bytes memory batchFillCalldata = abi.encodeWithSelector(
            batchFillFunctionSelector,
            orders,
            takerAssetFillAmounts,
            signatures
        );
        // solhint-disable-next-line avoid-call-value
        (bool didSucceed, bytes memory returnData) = _EXCHANGE.call.value(msg.value)(batchFillCalldata);
        if (didSucceed) {
            // solhint-disable-next-line indent
            fillResults = abi.decode(returnData, (LibFillResults.FillResults[]));
        } else {
            assembly {
                revert(add(returnData, 32), mload(returnData))
            }
        }

        // Transfer maker assets to taker
        for (uint256 i = 0; i < orders.length; i++) {
            orders[i].makerAssetData.transferOut(fillResults[i].makerAssetFilledAmount);
        }

        // Clear storage
        delete _cachedAssetData;
        _cacheIndex = 0;
        _sender = address(0);

        return fillResults;
    }
}
