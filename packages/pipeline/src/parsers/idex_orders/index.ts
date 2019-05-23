import { BigNumber } from '@0x/utils';

import { aggregateOrders } from '../utils';

import { IDEX_SOURCE, IdexOrderbook, IdexOrderParam } from '../../data_sources/idex';
import { TokenOrderbookSnapshot as TokenOrder } from '../../entities';
import { OrderType } from '../../types';

/**
 * Marquee function of this file.
 * 1) Takes in orders from an orderbook,
 * 2) Aggregates them by price point,
 * 3) Parses them into entities which are then saved into the database.
 * @param idexOrderbook raw orderbook that we pull from the Idex API.
 * @param observedTimestamp Time at which the orders for the market were pulled.
 */
export function parseIdexOrders(idexOrderbook: IdexOrderbook, observedTimestamp: number): TokenOrder[] {
    const aggregatedBids = aggregateOrders(idexOrderbook.bids);
    // Any of the bid orders' params will work
    const idexBidOrder = idexOrderbook.bids[0];
    const parsedBids =
        aggregatedBids.length > 0
            ? aggregatedBids.map(order => parseIdexOrder(idexBidOrder.params, observedTimestamp, OrderType.Bid, order))
            : [];

    const aggregatedAsks = aggregateOrders(idexOrderbook.asks);
    // Any of the ask orders' params will work
    const idexAskOrder = idexOrderbook.asks[0];
    const parsedAsks =
        aggregatedAsks.length > 0
            ? aggregatedAsks.map(order => parseIdexOrder(idexAskOrder.params, observedTimestamp, OrderType.Ask, order))
            : [];
    return parsedBids.concat(parsedAsks);
}

/**
 * Parse a single aggregated Idex order in order to form a tokenOrder entity
 * which can be saved into the database.
 * @param idexOrderParam An object containing information about the market where these
 * trades have been placed.
 * @param observedTimestamp The time when the API response returned back to us.
 * @param orderType 'bid' or 'ask' enum.
 * @param idexOrder A <price, amount> tuple which we will convert to volume-basis.
 */
export function parseIdexOrder(
    idexOrderParam: IdexOrderParam,
    observedTimestamp: number,
    orderType: OrderType,
    idexOrder: [string, BigNumber],
): TokenOrder {
    const tokenOrder = new TokenOrder();
    const price = new BigNumber(idexOrder[0]);
    const amount = idexOrder[1];

    tokenOrder.source = IDEX_SOURCE;
    tokenOrder.observedTimestamp = observedTimestamp;
    tokenOrder.orderType = orderType;
    tokenOrder.price = price;
    tokenOrder.baseVolume = amount;
    tokenOrder.quoteVolume = price.times(amount);
    tokenOrder.makerAddress = 'unknown';

    if (orderType === OrderType.Bid) {
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
