import { BigNumber } from '@0x/utils';
import * as R from 'ramda';

import { NonfungibleDotComTradeResponse } from '../../data_sources/nonfungible_dot_com';
import { NftTrade } from '../../entities';

/**
 * Parses a raw trades from the nonfungible.com API and returns an array of
 * NftTrade entities.
 * @param rawTrades A raw order response from an SRA endpoint.
 */
export function parseNonFungibleDotComTrades(
    rawTrades: NonfungibleDotComTradeResponse[],
    publisher: string,
): NftTrade[] {
    return R.map(_parseNonFungibleDotComTrade.bind(null, publisher), rawTrades);
}

/**
 * Converts a single trade from nonfungible.com into an NftTrade entity.
 * @param rawTrade A single trade from the response from the nonfungible.com API.
 */
export function _parseNonFungibleDotComTrade(publisher: string, rawTrade: NonfungibleDotComTradeResponse): NftTrade {
    const nftTrade = new NftTrade();
    nftTrade.assetDescriptor = rawTrade.assetDescriptor;
    nftTrade.assetId = rawTrade.assetId;
    nftTrade.blockNumber = rawTrade.blockNumber;
    nftTrade.blockTimestamp = new Date(rawTrade.blockTimestamp).getTime();
    nftTrade.buyerAddress = rawTrade.buyer;
    nftTrade.logIndex = rawTrade.logIndex;
    nftTrade.marketAddress = rawTrade.marketAddress;
    nftTrade.meta = rawTrade.meta;
    nftTrade.sellerAddress = rawTrade.seller;
    nftTrade.totalPrice = new BigNumber(rawTrade.totalPrice);
    nftTrade.transactionHash = rawTrade.transactionHash;
    nftTrade.usdPrice = new BigNumber(rawTrade.usdPrice);
    nftTrade.publisher = publisher;
    return nftTrade;
}
