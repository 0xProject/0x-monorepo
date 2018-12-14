import { BigNumber } from '@0x/utils';

import { aggregateOrders } from '../utils';

import { DdexMarket, DdexOrderbook } from '../../data_sources/ddex';
import { TokenOrderbookSnapshot as TokenOrder } from '../../entities';
import { OrderType } from '../../types';

/**
 * Marque function of this file.
 * 1) Takes in orders from an orderbook,
 * other information attached.
 * @param ddexOrderbook A raw orderbook that we pull from the Ddex API.
 * @param ddexMarket An object containing market data also directly from the API.
 * @param observedTimestamp Time at which the orders for the market were pulled.
 * @param source The exchange where these orders are placed. In this case 'ddex'.
 */
export function parseDdexOrders(
    ddexOrderbook: DdexOrderbook,
    ddexMarket: DdexMarket,
    observedTimestamp: number,
    source: string,
): TokenOrder[] {
    const aggregatedBids = aggregateOrders(ddexOrderbook.bids);
    const aggregatedAsks = aggregateOrders(ddexOrderbook.asks);
    const parsedBids = aggregatedBids.map(order => parseDdexOrder(ddexMarket, observedTimestamp, 'bid', source, order));
    const parsedAsks = aggregatedAsks.map(order => parseDdexOrder(ddexMarket, observedTimestamp, 'ask', source, order));
    return parsedBids.concat(parsedAsks);
}

/**
 * Parse a single aggregated Ddex order in order to form a tokenOrder entity
 * which can be saved into the database.
 * @param ddexMarket An object containing information about the market where these
 * trades have been placed.
 * @param observedTimestamp The time when the API response returned back to us.
 * @param orderType 'bid' or 'ask' enum.
 * @param source Exchange where these orders were placed.
 * @param ddexOrder A <price, amount> tuple which we will convert to volume-basis.
 */
export function parseDdexOrder(
    ddexMarket: DdexMarket,
    observedTimestamp: number,
    orderType: OrderType,
    source: string,
    ddexOrder: [string, BigNumber],
): TokenOrder {
    const tokenOrder = new TokenOrder();
    const price = new BigNumber(ddexOrder[0]);
    const amount = ddexOrder[1];

    tokenOrder.source = source;
    tokenOrder.observedTimestamp = observedTimestamp;
    tokenOrder.orderType = orderType;
    tokenOrder.price = price;

    // ddex currently confuses quote and base assets.
    // We switch them here to maintain our internal consistency.
    tokenOrder.baseAssetSymbol = ddexMarket.quoteToken;
    tokenOrder.baseAssetAddress = ddexMarket.quoteTokenAddress;
    tokenOrder.baseVolume = amount;

    tokenOrder.quoteAssetSymbol = ddexMarket.baseToken;
    tokenOrder.quoteAssetAddress = ddexMarket.baseTokenAddress;
    tokenOrder.quoteVolume = price.times(amount);
    return tokenOrder;
}
