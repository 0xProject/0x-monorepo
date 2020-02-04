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

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetData.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "@0x/contracts-erc721/contracts/src/interfaces/IERC721Token.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-extensions/contracts/src/LibAssetDataTransfer.sol";
import "@0x/contracts-extensions/contracts/src/MixinWethUtils.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "./interfaces/IBroker.sol";
import "./interfaces/IPropertyValidator.sol";
import "./libs/LibBrokerRichErrors.sol";


// solhint-disable space-after-comma, var-name-mixedcase
contract Broker is
    IBroker,
    MixinWethUtils
{
    // Contract addresses

    // Address of the 0x Exchange contract
    address internal EXCHANGE;
    // Address of the 0x ERC1155 Asset Proxy contract
    address internal ERC1155_PROXY;

    // The following storage variables are used to cache data for the duration of the transcation.
    // They should always cleared at the end of the transaction.

    // Token IDs specified by the taker to be used to fill property-based orders.
    uint256[] internal _cachedTokenIds;
    // An index to the above array keeping track of which assets have been transferred.
    uint256 internal _cacheIndex;
    // The address that called `brokerTrade` or `batchBrokerTrade`. Assets will be transferred to
    // and from this address as the effectual taker of the orders.
    address internal _sender;

    using LibSafeMath for uint256;
    using LibBytes for bytes;
    using LibAssetDataTransfer for bytes;

    /// @param exchange Address of the 0x Exchange contract.
    /// @param exchange Address of the Wrapped Ether contract.
    /// @param exchange Address of the 0x ERC1155 Asset Proxy contract.
    constructor (
        address exchange,
        address weth
    )
        public
        MixinWethUtils(
            exchange,
            weth
        )
    {
        EXCHANGE = exchange;
        ERC1155_PROXY = IExchange(EXCHANGE).getAssetProxy(IAssetData(address(0)).ERC1155Assets.selector);
    }

    /// @dev The Broker implements the ERC1155 transfer function to be compatible with the ERC1155 asset proxy
    /// @param from Since the Broker serves as the taker of the order, this should equal `address(this)`
    /// @param to This should be the maker of the order.
    /// @param amounts Should be an array of just one `uint256`, specifying the amount of the brokered assets to transfer.
    /// @param data Encodes the validator contract address and any auxiliary data it needs for property validation.
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata /* ids */,
        uint256[] calldata amounts,
        bytes calldata data
    )
        external
    {
        // Only the ERC1155 asset proxy contract should be calling this function.
        if (msg.sender != ERC1155_PROXY) {
            LibRichErrors.rrevert(LibBrokerRichErrors.OnlyERC1155ProxyError(
                msg.sender
            ));
        }
        // Only `takerAssetData` should be using Broker assets
        if (from != address(this)) {
            LibRichErrors.rrevert(
                LibBrokerRichErrors.InvalidFromAddressError(from)
            );
        }
        // Only one asset amount should be specified.
        if (amounts.length != 1) {
            LibRichErrors.rrevert(
                LibBrokerRichErrors.AmountsLengthMustEqualOneError(amounts.length)
            );
        }

        uint256 cacheIndex = _cacheIndex;
        uint256 remainingAmount = amounts[0];

        // Verify that there are enough broker assets to transfer
        if (_cachedTokenIds.length.safeSub(cacheIndex) < remainingAmount) {
            LibRichErrors.rrevert(
                LibBrokerRichErrors.TooFewBrokerAssetsProvidedError(_cachedTokenIds.length)
            );
        }

        // Decode validator and params from `data`
        (address tokenAddress, address validator, bytes memory propertyData) = abi.decode(
            data,
            (address, address, bytes)
        );

        while (remainingAmount != 0) {
            uint256 tokenId = _cachedTokenIds[cacheIndex];
            cacheIndex++;

            // Validate asset properties
            IPropertyValidator(validator).checkBrokerAsset(
                tokenId,
                propertyData
            );

            // Perform the transfer
            IERC721Token(tokenAddress).transferFrom(
                _sender,
                to,
                tokenId
            );

            remainingAmount--;
        }
        // Update cache index in storage
        _cacheIndex = cacheIndex;
    }

    /// @dev Fills a single property-based order by the given amount using the given assets.
    ///      Pays protocol fees using either the ETH supplied by the taker to the transaction or
    ///      WETH acquired from the maker during settlement. The final WETH balance is sent to the taker.
    /// @param brokeredTokenIds Token IDs specified by the taker to be used to fill the orders.
    /// @param order The property-based order to fill. The format of a property-based order is the
    ///        same as that of a normal order, except the takerAssetData. Instaed of specifying a
    ///        specific ERC721 asset, the takerAssetData should be ERC1155 assetData where the
    ///        underlying tokenAddress is this contract's address and the desired properties are
    ///        encoded in the extra data field. Also note that takerFees must be denominated in
    ///        WETH (or zero).
    /// @param takerAssetFillAmount The amount to fill the order by.
    /// @param signature The maker's signature of the given order.
    /// @param fillFunctionSelector The selector for either `fillOrder` or `fillOrKillOrder`.
    /// @param ethFeeAmounts Amounts of ETH, denominated in Wei, that are paid to corresponding feeRecipients.
    /// @param feeRecipients Addresses that will receive ETH when orders are filled.
    /// @return fillResults Amounts filled and fees paid by the maker and taker.
    function brokerTrade(
        uint256[] memory brokeredTokenIds,
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature,
        bytes4 fillFunctionSelector,
        uint256[] memory ethFeeAmounts,
        address payable[] memory feeRecipients
    )
        public
        payable
        returns (LibFillResults.FillResults memory fillResults)
    {
        // Cache the taker-supplied asset data
        _cachedTokenIds = brokeredTokenIds;
        // Cache the sender's address
        _sender = msg.sender;

        // Sanity-check the provided function selector
        if (
            fillFunctionSelector != IExchange(address(0)).fillOrder.selector &&
            fillFunctionSelector != IExchange(address(0)).fillOrKillOrder.selector
        ) {
            LibBrokerRichErrors.InvalidFunctionSelectorError(fillFunctionSelector);
        }

        // Pay ETH affiliate fees to all feeRecipient addresses
        _transferEthFeesAndWrapRemaining(ethFeeAmounts, feeRecipients);

        // Perform the fill
        bytes memory fillCalldata = abi.encodeWithSelector(
            fillFunctionSelector,
            order,
            takerAssetFillAmount,
            signature
        );
        // solhint-disable-next-line avoid-call-value
        (bool didSucceed, bytes memory returnData) = EXCHANGE.call(fillCalldata);
        if (didSucceed) {
            fillResults = abi.decode(returnData, (LibFillResults.FillResults));
        } else {
            // Re-throw error
            LibRichErrors.rrevert(returnData);
        }

        // Transfer maker asset to taker
        if (!order.makerAssetData.equals(WETH_ASSET_DATA)) {
            order.makerAssetData.transferOut(fillResults.makerAssetFilledAmount);
        }

        // Refund remaining ETH to msg.sender.
        _unwrapAndTransferEth(WETH.balanceOf(address(this)));

        _clearStorage();

        return fillResults;
    }

    /// @dev Fills multiple property-based orders by the given amounts using the given assets.
    ///      Pays protocol fees using either the ETH supplied by the taker to the transaction or
    ///      WETH acquired from the maker during settlement. The final WETH balance is sent to the taker.
    /// @param brokeredTokenIds Token IDs specified by the taker to be used to fill the orders.
    /// @param orders The property-based orders to fill. The format of a property-based order is the
    ///        same as that of a normal order, except the takerAssetData. Instaed of specifying a
    ///        specific ERC721 asset, the takerAssetData should be ERC1155 assetData where the
    ///        underlying tokenAddress is this contract's address and the desired properties are
    ///        encoded in the extra data field. Also note that takerFees must be denominated in
    ///        WETH (or zero).
    /// @param takerAssetFillAmounts The amounts to fill the orders by.
    /// @param signatures The makers' signatures for the given orders.
    /// @param batchFillFunctionSelector The selector for either `batchFillOrders`,
    ///        `batchFillOrKillOrders`, or `batchFillOrdersNoThrow`.
    /// @param ethFeeAmounts Amounts of ETH, denominated in Wei, that are paid to corresponding feeRecipients.
    /// @param feeRecipients Addresses that will receive ETH when orders are filled.
    /// @return fillResults Amounts filled and fees paid by the makers and taker.
    function batchBrokerTrade(
        uint256[] memory brokeredTokenIds,
        LibOrder.Order[] memory orders,
        uint256[] memory takerAssetFillAmounts,
        bytes[] memory signatures,
        bytes4 batchFillFunctionSelector,
        uint256[] memory ethFeeAmounts,
        address payable[] memory feeRecipients
    )
        public
        payable
        returns (LibFillResults.FillResults[] memory fillResults)
    {
        // Cache the taker-supplied asset data
        _cachedTokenIds = brokeredTokenIds;
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

        // Pay ETH affiliate fees to all feeRecipient addresses
        _transferEthFeesAndWrapRemaining(ethFeeAmounts, feeRecipients);

        // Perform the batch fill
        bytes memory batchFillCalldata = abi.encodeWithSelector(
            batchFillFunctionSelector,
            orders,
            takerAssetFillAmounts,
            signatures
        );
        // solhint-disable-next-line avoid-call-value
        (bool didSucceed, bytes memory returnData) = EXCHANGE.call(batchFillCalldata);
        if (didSucceed) {
            // solhint-disable-next-line indent
            fillResults = abi.decode(returnData, (LibFillResults.FillResults[]));
        } else {
            // Re-throw error
            LibRichErrors.rrevert(returnData);
        }

        // Transfer maker assets to taker
        for (uint256 i = 0; i < orders.length; i++) {
            if (!orders[i].makerAssetData.equals(WETH_ASSET_DATA)) {
                orders[i].makerAssetData.transferOut(fillResults[i].makerAssetFilledAmount);
            }
        }

        // Refund remaining ETH to msg.sender.
        _unwrapAndTransferEth(WETH.balanceOf(address(this)));

        _clearStorage();

        return fillResults;
    }

    function _clearStorage()
        private
    {
        delete _cachedTokenIds;
        _cacheIndex = 0;
        _sender = address(0);
    }
}
