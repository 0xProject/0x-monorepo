import { BigNumber } from '@0x/utils';
import * as R from 'ramda';

import { DdexMarket, DdexOrder, DdexOrderbook } from '../../data_sources/ddex';
import { TokenOrderbookSnapshot as TokenOrder } from '../../entities';
import { OrderType } from '../../types';

/**
 * Marque function of this file.
 * 1) Takes in orders from an orderbook,
 * 2) Aggregates the orders based on price point,
 * 3) For each aggregated order, forms a TokenOrder entity with market data and
 * other information attached.
 * @param ddexOrderbook A raw orderbook that we pull from the Ddex API.
 * @param ddexMarket An object containing market data also directly from the API.
 * @param retrievalTimestamp Time at which the orders for the market were pulled.
 * @param source The exchange where these orders are placed. In this case 'ddex'.
 */
export function parseDdexOrders(
    ddexOrderbook: DdexOrderbook,
    ddexMarket: DdexMarket,
    retrievalTimestamp: number,
    source: string,
): TokenOrder[] {
    const aggregatedBids = aggregateOrders(ddexOrderbook.bids);
    const aggregatedAsks = aggregateOrders(ddexOrderbook.asks);
    // Might want to shift 'bid', 'ask' enums to 0x/types and retrieve from there.
    const parsedBids = aggregatedBids.map(order =>
        parseDdexOrder(ddexMarket, retrievalTimestamp, 'bid', source, order),
    );
    const parsedAsks = aggregatedAsks.map(order =>
        parseDdexOrder(ddexMarket, retrievalTimestamp, 'ask', source, order),
    );
    return parsedBids.concat(parsedAsks);
}

/**
 * Aggregates orders by price point for consistency with other exchanges.
 * Querying the Ddex API at level 3 setting returns a breakdown of
 * individual orders at each price point. Other exchanges only give total amount
 * at each price point. Returns an array of <price, amount> tuples.
 * @param ddexOrders A list of Ddex orders awaiting aggregation.
 */
export function aggregateOrders(ddexOrders: DdexOrder[]): Array<[string, number]> {
    const sumAmount = (acc: number, order: DdexOrder): number => acc + Number(order.amount);
    const aggregatedPricePoints = R.reduceBy(sumAmount, 0, R.prop('price'), ddexOrders);
    return Object.entries(aggregatedPricePoints);
}

/**
 * Parse a single aggregated Ddex order in order to form a tokenOrder entity
 * which can be saved into the database.
 * @param ddexMarket An object containing information about the market where these
 * trades have been placed.
 * @param retrievalTimestamp The time when the API response returned back to us.
 * @param orderType Eg. 'bid' or 'ask'. Will be converted into an enum.
 * @param source Exchange where these orders were placed.
 * @param ddexOrder A <price, amount> tuple which we will convert to volume-basis.
 */
export function parseDdexOrder(
    ddexMarket: DdexMarket,
    retrievalTimestamp: number,
    orderType: string,
    source: string,
    ddexOrder: [string, number],
): TokenOrder {
    BigNumber.config({ ERRORS: false });

    const tokenOrder = new TokenOrder();
    const price = Number(ddexOrder[0]);
    const amount = ddexOrder[1];

    tokenOrder.source = source;
    tokenOrder.retrievalTimestamp = retrievalTimestamp;
    tokenOrder.orderType = orderType as OrderType;

    tokenOrder.baseAssetSymbol = ddexMarket.baseToken;
    tokenOrder.baseAssetAddress = ddexMarket.baseTokenAddress;
    tokenOrder.baseVolume = new BigNumber(price * amount);

    tokenOrder.quoteAssetSymbol = ddexMarket.quoteToken;
    tokenOrder.quoteAssetAddress = ddexMarket.quoteTokenAddress;
    tokenOrder.quoteVolume = new BigNumber(amount);
    return tokenOrder;
}
