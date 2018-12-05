import { BigNumber } from '@0x/utils';
import * as R from 'ramda';

import { IdexOrder, IdexOrderbook, IdexOrderParam } from '../../data_sources/idex';
import { TokenOrderbookSnapshot as TokenOrder } from '../../entities';
import { OrderType } from '../../types';

/**
 * Marque function of this file.
 * 1) Takes in orders from an orderbook,
 * 2) Aggregates them by price point,
 * 3) Parses them into entities which are then saved into the database.
 * @param idexOrderbook raw orderbook that we pull from the Idex API.
 * @param observedTimestamp Time at which the orders for the market were pulled.
 * @param source The exchange where these orders are placed. In this case 'idex'.
 */
export function parseIdexOrders(idexOrderbook: IdexOrderbook, observedTimestamp: number, source: string): TokenOrder[] {
    const aggregatedBids = aggregateOrders(idexOrderbook.bids);
    // Any of the bid orders' params will work
    const idexBidOrder = idexOrderbook.bids[0];
    const parsedBids =
        aggregatedBids.length > 0
            ? aggregatedBids.map(order => parseIdexOrder(idexBidOrder.params, observedTimestamp, 'bid', source, order))
            : [];

    const aggregatedAsks = aggregateOrders(idexOrderbook.asks);
    // Any of the ask orders' params will work
    const idexAskOrder = idexOrderbook.asks[0];
    const parsedAsks =
        aggregatedAsks.length > 0
            ? aggregatedAsks.map(order => parseIdexOrder(idexAskOrder.params, observedTimestamp, 'ask', source, order))
            : [];
    return parsedBids.concat(parsedAsks);
}

/**
 * Aggregates orders by price point for consistency with other exchanges.
 * The Idex API returns a breakdown of individual orders at each price point.
 * Other exchanges only give total amount at each price point.
 * Returns an array of <price, amount> tuples.
 * @param idexOrders A list of Idex orders awaiting aggregation.
 */
export function aggregateOrders(idexOrders: IdexOrder[]): Array<[string, BigNumber]> {
    const sumAmount = (acc: BigNumber, order: IdexOrder): BigNumber => acc.plus(order.amount);
    const aggregatedPricePoints = R.reduceBy(sumAmount, new BigNumber(0), R.prop('price'), idexOrders);
    return Object.entries(aggregatedPricePoints);
}

/**
 * Parse a single aggregated Idex order in order to form a tokenOrder entity
 * which can be saved into the database.
 * @param idexOrderParam An object containing information about the market where these
 * trades have been placed.
 * @param observedTimestamp The time when the API response returned back to us.
 * @param orderType 'bid' or 'ask' enum.
 * @param source Exchange where these orders were placed.
 * @param idexOrder A <price, amount> tuple which we will convert to volume-basis.
 */
export function parseIdexOrder(
    idexOrderParam: IdexOrderParam,
    observedTimestamp: number,
    orderType: OrderType,
    source: string,
    idexOrder: [string, BigNumber],
): TokenOrder {
    const tokenOrder = new TokenOrder();
    const price = new BigNumber(idexOrder[0]);
    const amount = idexOrder[1];

    tokenOrder.source = source;
    tokenOrder.observedTimestamp = observedTimestamp;
    tokenOrder.orderType = orderType;
    tokenOrder.price = price;
    tokenOrder.baseVolume = amount;
    tokenOrder.quoteVolume = price.times(amount);

    if (orderType === 'bid') {
        tokenOrder.baseAssetSymbol = idexOrderParam.buySymbol;
        tokenOrder.baseAssetAddress = idexOrderParam.tokenBuy;
        tokenOrder.quoteAssetSymbol = idexOrderParam.sellSymbol;
        tokenOrder.quoteAssetAddress = idexOrderParam.tokenSell;
    } else {
        tokenOrder.baseAssetSymbol = idexOrderParam.sellSymbol;
        tokenOrder.baseAssetAddress = idexOrderParam.tokenSell;
        tokenOrder.quoteAssetSymbol = idexOrderParam.buySymbol;
        tokenOrder.quoteAssetAddress = idexOrderParam.tokenBuy;
    }
    return tokenOrder;
}
