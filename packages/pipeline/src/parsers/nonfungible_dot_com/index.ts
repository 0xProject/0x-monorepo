import { BigNumber } from '@0x/utils';
import * as R from 'ramda';

import { NonfungibleDotComTradeResponse } from '../../data_sources/nonfungible_dot_com';
import { NonfungibleDotComTrade } from '../../entities';

/**
 * Parses a raw trades from the nonfungible.com API and returns an array of
 * NonfungibleDotComTrade entities.
 * @param rawTrades A raw order response from an SRA endpoint.
 */
export function parseNonFungibleDotComTrades(
    rawTrades: NonfungibleDotComTradeResponse[],
    publisher: string,
): NonfungibleDotComTrade[] {
    return R.map(_parseNonFungibleDotComTrade.bind(null, publisher), rawTrades);
}

/**
 * Converts a single trade from nonfungible.com into an NonfungibleDotComTrade entity.
 * @param rawTrade A single trade from the response from the nonfungible.com API.
 */
export function _parseNonFungibleDotComTrade(
    publisher: string,
    rawTrade: NonfungibleDotComTradeResponse,
): NonfungibleDotComTrade {
    const nonfungibleDotComTrade = new NonfungibleDotComTrade();
    nonfungibleDotComTrade.assetDescriptor = rawTrade.assetDescriptor;
    nonfungibleDotComTrade.assetId = rawTrade.assetId;
    nonfungibleDotComTrade.blockNumber = rawTrade.blockNumber;
    nonfungibleDotComTrade.blockTimestamp = new Date(rawTrade.blockTimestamp).getTime();
    nonfungibleDotComTrade.buyerAddress = rawTrade.buyer;
    nonfungibleDotComTrade.logIndex = rawTrade.logIndex;
    nonfungibleDotComTrade.marketAddress = rawTrade.marketAddress;
    nonfungibleDotComTrade.meta = rawTrade.meta;
    nonfungibleDotComTrade.sellerAddress = rawTrade.seller;
    nonfungibleDotComTrade.totalPrice = new BigNumber(rawTrade.totalPrice);
    nonfungibleDotComTrade.transactionHash = rawTrade.transactionHash;
    nonfungibleDotComTrade.usdPrice = new BigNumber(rawTrade.usdPrice);
    nonfungibleDotComTrade.publisher = publisher;
    return nonfungibleDotComTrade;
}
