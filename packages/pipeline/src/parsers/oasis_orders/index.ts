import { BigNumber } from '@0x/utils';
import * as R from 'ramda';

import { aggregateOrders } from '../utils';

import { OasisMarket, OasisOrder } from '../../data_sources/oasis';
import { TokenOrderbookSnapshot as TokenOrder } from '../../entities';
import { OrderType } from '../../types';

/**
 * Marque function of this file.
 * 1) Takes in orders from an orderbook,
 * 2) Aggregates them according to price point,
 * 3) Builds TokenOrder entity with other information attached.
 * @param oasisOrderbook A raw orderbook that we pull from the Oasis API.
 * @param oasisMarket An object containing market data also directly from the API.
 * @param observedTimestamp Time at which the orders for the market were pulled.
 * @param source The exchange where these orders are placed. In this case 'oasis'.
 */
export function parseOasisOrders(
    oasisOrderbook: OasisOrder[],
    oasisMarket: OasisMarket,
    observedTimestamp: number,
    source: string,
): TokenOrder[] {
    const aggregatedBids = aggregateOrders(R.filter(R.propEq('act', OrderType.Bid), oasisOrderbook));
    const aggregatedAsks = aggregateOrders(R.filter(R.propEq('act', OrderType.Ask), oasisOrderbook));
    const parsedBids = aggregatedBids.map(order =>
        parseOasisOrder(oasisMarket, observedTimestamp, OrderType.Bid, source, order),
    );
    const parsedAsks = aggregatedAsks.map(order =>
        parseOasisOrder(oasisMarket, observedTimestamp, OrderType.Ask, source, order),
    );
    return parsedBids.concat(parsedAsks);
}

/**
 * Parse a single aggregated Oasis order to form a tokenOrder entity
 * which can be saved into the database.
 * @param oasisMarket An object containing information about the market where these
 * trades have been placed.
 * @param observedTimestamp The time when the API response returned back to us.
 * @param orderType 'bid' or 'ask' enum.
 * @param source Exchange where these orders were placed.
 * @param oasisOrder A <price, amount> tuple which we will convert to volume-basis.
 */
export function parseOasisOrder(
    oasisMarket: OasisMarket,
    observedTimestamp: number,
    orderType: OrderType,
    source: string,
    oasisOrder: [string, BigNumber],
): TokenOrder {
    const tokenOrder = new TokenOrder();
    const price = new BigNumber(oasisOrder[0]);
    const amount = oasisOrder[1];

    tokenOrder.source = source;
    tokenOrder.observedTimestamp = observedTimestamp;
    tokenOrder.orderType = orderType;
    tokenOrder.price = price;

    tokenOrder.baseAssetSymbol = oasisMarket.base;
    tokenOrder.baseAssetAddress = null; // Oasis doesn't provide address information
    tokenOrder.baseVolume = amount;

    tokenOrder.quoteAssetSymbol = oasisMarket.quote;
    tokenOrder.quoteAssetAddress = null; // Oasis doesn't provide address information
    tokenOrder.quoteVolume = price.times(amount);
    tokenOrder.makerAddress = 'unknown';
    return tokenOrder;
}
