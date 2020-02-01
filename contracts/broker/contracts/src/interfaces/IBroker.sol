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

import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";


// solhint-disable space-after-comma
interface IBroker {

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
        uint256[] calldata brokeredTokenIds,
        LibOrder.Order calldata order,
        uint256 takerAssetFillAmount,
        bytes calldata signature,
        bytes4 fillFunctionSelector,
        uint256[] calldata ethFeeAmounts,
        address payable[] calldata feeRecipients
    )
        external
        payable
        returns (LibFillResults.FillResults memory fillResults);

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
        uint256[] calldata brokeredTokenIds,
        LibOrder.Order[] calldata orders,
        uint256[] calldata takerAssetFillAmounts,
        bytes[] calldata signatures,
        bytes4 batchFillFunctionSelector,
        uint256[] calldata ethFeeAmounts,
        address payable[] calldata feeRecipients
    )
        external
        payable
        returns (LibFillResults.FillResults[] memory fillResults);

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
        external;
}
