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

pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "../../protocol/Exchange/interfaces/IExchange.sol";
import "../../protocol/Exchange/libs/LibOrder.sol";
import "../../tokens/ERC20Token/IERC20Token.sol";
import "../../utils/LibBytes/LibBytes.sol";


contract DutchAuction {
    using LibBytes for bytes;

    // solhint-disable var-name-mixedcase
    IExchange internal EXCHANGE;

    struct AuctionDetails {
        uint256 beginTimeSeconds;    // Auction begin time in seconds: sellOrder.makerAssetData
        uint256 endTimeSeconds;      // Auction end time in seconds: sellOrder.expiryTimeSeconds
        uint256 beginAmount;         // Auction begin amount: sellOrder.makerAssetData
        uint256 endAmount;           // Auction end amount: sellOrder.takerAssetAmount
        uint256 currentAmount;       // Calculated amount given block.timestamp
        uint256 currentTimeSeconds;  // block.timestamp
    }

    constructor (address _exchange)
        public
    {
        EXCHANGE = IExchange(_exchange);
    }

    /// @dev Matches the buy and sell orders at an amount given the following: the current block time, the auction
    ///      start time and the auction begin amount. The sell order is a an order at the lowest amount
    ///      at the end of the auction. Excess from the match is transferred to the seller.
    ///      Over time the price moves from beginAmount to endAmount given the current block.timestamp.
    ///      sellOrder.expiryTimeSeconds is the end time of the auction.
    ///      sellOrder.takerAssetAmount is the end amount of the auction (lowest possible amount).
    ///      sellOrder.makerAssetData is the ABI encoded Asset Proxy data with the following data appended
    ///      buyOrder.makerAssetData is the buyers bid on the auction, must meet the amount for the current block timestamp
    ///      (uint256 beginTimeSeconds, uint256 beginAmount).
    ///      This function reverts in the following scenarios:
    ///         * Auction has not started (auctionDetails.currentTimeSeconds < auctionDetails.beginTimeSeconds)
    ///         * Auction has expired (auctionDetails.endTimeSeconds < auctionDetails.currentTimeSeconds)
    ///         * Amount is invalid: Buy order amount is too low (buyOrder.makerAssetAmount < auctionDetails.currentAmount)
    ///         * Amount is invalid: Invalid begin amount (auctionDetails.beginAmount > auctionDetails.endAmount)
    ///         * Any failure in the 0x Match Orders
    /// @param buyOrder The Buyer's order. This order is for the current expected price of the auction.
    /// @param sellOrder The Seller's order. This order is for the lowest amount (at the end of the auction).
    /// @param buySignature Proof that order was created by the buyer.
    /// @param sellSignature Proof that order was created by the seller.
    /// @return matchedFillResults amounts filled and fees paid by maker and taker of matched orders.
    function matchOrders(
        LibOrder.Order memory buyOrder,
        LibOrder.Order memory sellOrder,
        bytes memory buySignature,
        bytes memory sellSignature
    )
        public
        returns (LibFillResults.MatchedFillResults memory matchedFillResults)
    {
        AuctionDetails memory auctionDetails = getAuctionDetails(sellOrder);
        // Ensure the auction has not yet started
        require(auctionDetails.currentTimeSeconds >= auctionDetails.beginTimeSeconds, "AUCTION_NOT_STARTED");
        // Ensure the auction has not expired. This will fail later in 0x but we can save gas by failing early
        require(sellOrder.expirationTimeSeconds > auctionDetails.currentTimeSeconds, "AUCTION_EXPIRED");
        // Ensure the auction goes from high to low
        require(auctionDetails.beginAmount > auctionDetails.endAmount, "INVALID_AMOUNT");
        // Validate the buyer amount is greater than the current auction amount
        require(buyOrder.makerAssetAmount >= auctionDetails.currentAmount, "INVALID_AMOUNT");
        // Match orders, maximally filling `buyOrder`
        matchedFillResults = EXCHANGE.matchOrders(
            buyOrder,
            sellOrder,
            buySignature,
            sellSignature
        );
        // Return any spread to the seller
        uint256 leftMakerAssetSpreadAmount = matchedFillResults.leftMakerAssetSpreadAmount;
        if (leftMakerAssetSpreadAmount > 0) {
            // Assume auction is for ERC20
            bytes memory assetData = sellOrder.takerAssetData;
            address token = assetData.readAddress(16);
            address makerAddress = sellOrder.makerAddress;
            IERC20Token(token).transfer(makerAddress, leftMakerAssetSpreadAmount);
        }
        return matchedFillResults;
    }

    /// @dev Calculates the Auction Details for the given order
    /// @param order The sell order
    /// @return AuctionDetails
    function getAuctionDetails(
        LibOrder.Order memory order
    )
        public
        returns (AuctionDetails memory auctionDetails)
    {
        uint256 makerAssetDataLength = order.makerAssetData.length;
        // We assume auctionBeginTimeSeconds and auctionBeginAmount are appended to the makerAssetData
        uint256 auctionBeginTimeSeconds = order.makerAssetData.readUint256(makerAssetDataLength-64);
        uint256 auctionBeginAmount = order.makerAssetData.readUint256(makerAssetDataLength-32);
        // require(order.expirationTimeSeconds > auctionBeginTimeSeconds, "INVALID_BEGIN_TIME");
        uint256 auctionDurationSeconds = order.expirationTimeSeconds-auctionBeginTimeSeconds;
        uint256 minAmount = order.takerAssetAmount;
        // solhint-disable-next-line not-rely-on-time
        uint256 timestamp = block.timestamp;
        auctionDetails.beginTimeSeconds = auctionBeginTimeSeconds;
        auctionDetails.endTimeSeconds = order.expirationTimeSeconds;
        auctionDetails.beginAmount = auctionBeginAmount;
        auctionDetails.endAmount = minAmount;
        auctionDetails.currentTimeSeconds = timestamp;

        uint256 remainingDurationSeconds = order.expirationTimeSeconds-timestamp;
        uint256 amountDelta = auctionBeginAmount-minAmount;
        uint256 currentAmount = minAmount + (remainingDurationSeconds*amountDelta/auctionDurationSeconds);
        // If the auction has not yet begun the current amount is the auctionBeginAmount
        currentAmount = timestamp < auctionBeginTimeSeconds ? auctionBeginAmount : currentAmount;
        // If the auction has ended the current amount is the minAmount
        // auction end time is guaranteed by 0x Exchange to fail due to the order expiration
        currentAmount = timestamp >= order.expirationTimeSeconds ? minAmount : currentAmount;
        auctionDetails.currentAmount = currentAmount;
        return auctionDetails;
    }
}
