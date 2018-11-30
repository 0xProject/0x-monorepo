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
 * @param retrievalTimestamp Time at which the orders for the market were pulled.
 * @param source The exchange where these orders are placed. In this case 'paradex'.
 */
export function parseParadexOrders(
    paradexOrderbookResponse: ParadexOrderbookResponse,
    paradexMarket: ParadexMarket,
    retrievalTimestamp: number,
    source: string,
): TokenOrder[] {
    // Might want to shift 'bid', 'ask' enums to 0x/types and retrieve from there.
    const parsedBids = paradexOrderbookResponse.bids.map(order =>
        parseParadexOrder(paradexMarket, retrievalTimestamp, 'bid', source, order),
    );
    const parsedAsks = paradexOrderbookResponse.asks.map(order =>
        parseParadexOrder(paradexMarket, retrievalTimestamp, 'ask', source, order),
    );
    return parsedBids.concat(parsedAsks);
}

/**
 * Parse a single aggregated Ddex order in order to form a tokenOrder entity
 * which can be saved into the database.
 * @param paradexMarket An object containing information about the market where these
 * orders have been placed.
 * @param retrievalTimestamp The time when the API response returned back to us.
 * @param orderType Eg. 'bid' or 'ask'. Will be converted into an enum.
 * @param source Exchange where these orders were placed.
 * @param paradexOrder A ParadexOrder object; basically price, amount tuple.
 */
export function parseParadexOrder(
    paradexMarket: ParadexMarket,
    retrievalTimestamp: number,
    orderType: string,
    source: string,
    paradexOrder: ParadexOrder,
): TokenOrder {
    BigNumber.config({ ERRORS: false });

    const tokenOrder = new TokenOrder();

    tokenOrder.source = source;
    tokenOrder.retrievalTimestamp = retrievalTimestamp;
    tokenOrder.orderType = orderType as OrderType;

    tokenOrder.baseAssetSymbol = paradexMarket.baseToken;
    tokenOrder.baseAssetAddress =
        typeof paradexMarket.baseTokenAddress === 'string' ? paradexMarket.baseTokenAddress : '';
    tokenOrder.baseVolume = new BigNumber(Number(paradexOrder.price) * Number(paradexOrder.amount));

    tokenOrder.quoteAssetSymbol = paradexMarket.quoteToken;
    tokenOrder.quoteAssetAddress =
        typeof paradexMarket.quoteTokenAddress === 'string' ? paradexMarket.quoteTokenAddress : '';
    tokenOrder.quoteVolume = new BigNumber(paradexOrder.amount);
    return tokenOrder;
}
