import { BigNumber } from '@0x/utils';

import { ParadexMarket, ParadexOrder, ParadexOrderbookResponse } from '../../data_sources/paradex';
import { TokenOrderbookSnapshot as TokenOrder } from '../../entities';
import { OrderType } from '../../types';

/**
 * Marque function of this file.
 * 1) Takes in orders from an orderbook (orders are already aggregated by price point),
 * 2) For each aggregated order, forms a TokenOrder entity with market data and
 * other information attached.
 * @param paradexOrderbookResponse An orderbook response from the Paradex API.
 * @param paradexMarket An object containing market data also directly from the API.
 * @param observedTimestamp Time at which the orders for the market were pulled.
 * @param source The exchange where these orders are placed. In this case 'paradex'.
 */
export function parseParadexOrders(
    paradexOrderbookResponse: ParadexOrderbookResponse,
    paradexMarket: ParadexMarket,
    observedTimestamp: number,
    source: string,
): TokenOrder[] {
    const parsedBids = paradexOrderbookResponse.bids.map(order =>
        parseParadexOrder(paradexMarket, observedTimestamp, OrderType.Bid, source, order),
    );
    const parsedAsks = paradexOrderbookResponse.asks.map(order =>
        parseParadexOrder(paradexMarket, observedTimestamp, OrderType.Ask, source, order),
    );
    return parsedBids.concat(parsedAsks);
}

/**
 * Parse a single aggregated Ddex order in order to form a tokenOrder entity
 * which can be saved into the database.
 * @param paradexMarket An object containing information about the market where these
 * orders have been placed.
 * @param observedTimestamp The time when the API response returned back to us.
 * @param orderType 'bid' or 'ask' enum.
 * @param source Exchange where these orders were placed.
 * @param paradexOrder A ParadexOrder object; basically price, amount tuple.
 */
export function parseParadexOrder(
    paradexMarket: ParadexMarket,
    observedTimestamp: number,
    orderType: OrderType,
    source: string,
    paradexOrder: ParadexOrder,
): TokenOrder {
    const tokenOrder = new TokenOrder();
    const price = new BigNumber(paradexOrder.price);
    const amount = new BigNumber(paradexOrder.amount);

    tokenOrder.source = source;
    tokenOrder.observedTimestamp = observedTimestamp;
    tokenOrder.orderType = orderType;
    tokenOrder.price = price;

    tokenOrder.baseAssetSymbol = paradexMarket.baseToken;
    tokenOrder.baseAssetAddress = paradexMarket.baseTokenAddress as string;
    tokenOrder.baseVolume = amount;

    tokenOrder.quoteAssetSymbol = paradexMarket.quoteToken;
    tokenOrder.quoteAssetAddress = paradexMarket.quoteTokenAddress as string;
    tokenOrder.quoteVolume = price.times(amount);
    tokenOrder.makerAddress = 'unknown';
    return tokenOrder;
}
