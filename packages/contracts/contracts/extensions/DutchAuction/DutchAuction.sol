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
        uint256 beginTime;    // Auction begin time in seconds
        uint256 endTime;      // Auction end time in seconds
        uint256 beginPrice;   // Auction begin price
        uint256 endPrice;     // Auction end price
        uint256 currentPrice; // Current auction price at block.timestamp
        uint256 currentTime;  // block.timestamp
    }

    constructor (address _exchange)
        public
    {
        EXCHANGE = IExchange(_exchange);
    }

    /// @dev Packs the begin time and price parameters of an auction into uint256.
    ///      This is stored as the salt value of the sale order.
    /// @param beginTime Begin time of the auction (32 bits)
    /// @param beginPrice Starting price of the auction (224 bits)
    /// @return Encoded Auction Parameters packed into a uint256
    function encodeParameters(
        uint256 beginTime,
        uint256 beginPrice
    )
        external
        view
        returns (uint256 encodedParameters)
    {
        require(beginTime <= 2**32, "INVALID_BEGIN_TIME");
        require(beginPrice <= 2**224, "INVALID_BEGIN_PRICE");
        encodedParameters = beginTime;
        encodedParameters |= beginPrice<<32;
        return encodedParameters;
    }

    /// @dev Performs a match of the two orders at the price point given the current block time and the auction
    ///      start time (encoded in the salt).
    ///      The Sellers order is a signed order at the lowest price at the end of the auction. Excess from the match
    ///      is transferred to the seller.
    /// @param buyOrder The Buyer's order
    /// @param sellOrder The Seller's order
    /// @param buySignature Proof that order was created by the left maker.
    /// @param sellSignature Proof that order was created by the right maker.
    /// @return matchedFillResults Amounts filled and fees paid by maker and taker of matched orders.
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
        require(auctionDetails.currentTime >= auctionDetails.beginTime, "AUCTION_NOT_STARTED");
        // Ensure the auction has not expired. This will fail later in 0x but we can save gas by failing early
        require(sellOrder.expirationTimeSeconds > auctionDetails.currentTime, "AUCTION_EXPIRED");
        // Ensure the auction goes from high to low
        require(auctionDetails.beginPrice > auctionDetails.endPrice, "INVALID_PRICE");
        // Validate the buyer amount is greater than the current auction price
        require(buyOrder.makerAssetAmount >= auctionDetails.currentPrice, "INVALID_PRICE");
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
            bytes memory assetData = sellOrder.takerAssetData;
            address token = assetData.readAddress(16);
            address makerAddress = sellOrder.makerAddress;
            IERC20Token(token).transfer(makerAddress, leftMakerAssetSpreadAmount);
        }
        return matchedFillResults;
    }

    /// @dev Decodes the packed parameters into beginTime and beginPrice.
    /// @param encodedParameters the encoded parameters
    /// @return beginTime and beginPrice decoded
    function decodeParameters(
        uint256 encodedParameters
    )
        public
        view
        returns (uint256 beginTime, uint256 beginPrice)
    {
        beginTime = encodedParameters & 0x00000000000000000000000fffffffff;
        beginPrice = encodedParameters>>32;
        return (beginTime, beginPrice);
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
        // solhint-disable-next-line indent
        (uint256 auctionBeginTimeSeconds, uint256 auctionBeginPrice) = decodeParameters(order.salt);
        require(order.expirationTimeSeconds > auctionBeginTimeSeconds, "INVALID_BEGIN_TIME");
        uint256 auctionDurationSeconds = order.expirationTimeSeconds-auctionBeginTimeSeconds;
        uint256 minPrice = order.takerAssetAmount;
        // solhint-disable-next-line not-rely-on-time
        uint256 timestamp = block.timestamp;
        auctionDetails.beginTime = auctionBeginTimeSeconds;
        auctionDetails.endTime = order.expirationTimeSeconds;
        auctionDetails.beginPrice = auctionBeginPrice;
        auctionDetails.endPrice = minPrice;
        auctionDetails.currentTime = timestamp;

        uint256 remainingDurationSeconds = order.expirationTimeSeconds-timestamp;
        uint256 priceDelta = auctionBeginPrice-minPrice;
        uint256 currentPrice = minPrice + (remainingDurationSeconds*priceDelta/auctionDurationSeconds);
        // If the auction has not yet begun the current price is the auctionBeginPrice
        currentPrice = timestamp < auctionBeginTimeSeconds ? auctionBeginPrice : currentPrice;
        // If the auction has ended the current price is the minPrice
        // auction end time is guaranteed by 0x Exchange to fail due to the order expiration
        currentPrice = timestamp >= order.expirationTimeSeconds ? minPrice : currentPrice;
        auctionDetails.currentPrice = currentPrice;
        return auctionDetails;
    }
}
