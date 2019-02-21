import { ObjectMap } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { RadarBook, RadarMarket, RadarSignedOrder } from '@radarrelay/types';
import * as R from 'ramda';

import { aggregateOrders, GenericRawOrder } from '../utils';

import { RADAR_SOURCE } from '../../data_sources/radar';
import { TokenOrderbookSnapshot as TokenOrder } from '../../entities';
import { OrderType } from '../../types';

export interface AggregateOrdersByMaker {
    makerAddress: string;
    price: string;
    amount: BigNumber;
}

/**
 * Marquee function of this file.
 * 1) Takes in orders from an orderbook,
 * other information attached.
 * @param radarOrderbook A raw orderbook that we pull from the radar API.
 * @param radarMarket An object containing market data also directly from the API.
 * @param observedTimestamp Time at which the orders for the market were pulled.
 */
export function parseRadarOrders(
    radarOrderbook: RadarBook,
    radarMarket: RadarMarket,
    observedTimestamp: number,
): TokenOrder[] {
    const aggregatedBids = _aggregateOrdersByMaker(radarMarket, radarOrderbook.bids);
    const aggregatedAsks = _aggregateOrdersByMaker(radarMarket, radarOrderbook.asks);
    const parsedBids = aggregatedBids.map(order =>
        parseRadarOrder(radarMarket, observedTimestamp, OrderType.Bid, order),
    );
    const parsedAsks = aggregatedAsks.map(order =>
        parseRadarOrder(radarMarket, observedTimestamp, OrderType.Ask, order),
    );
    return parsedBids.concat(parsedAsks);
}

/**
 * Parse a single aggregated radar order in order to form a tokenOrder entity
 * which can be saved into the database.
 * @param radarMarket An object containing information about the market where these
 * trades have been placed.
 * @param observedTimestamp The time when the API response returned back to us.
 * @param orderType 'bid' or 'ask' enum.
 * @param aggregateOrder An AggregateOrdersByMaker instance which we will convert to volume-basis.
 */
export function parseRadarOrder(
    radarMarket: RadarMarket,
    observedTimestamp: number,
    orderType: OrderType,
    aggregateOrder: AggregateOrdersByMaker,
): TokenOrder {
    const tokenOrder = new TokenOrder();
    const price = new BigNumber(aggregateOrder.price);
    const amount = aggregateOrder.amount;
    const splitId = radarMarket.id.split('-');

    tokenOrder.source = RADAR_SOURCE;
    tokenOrder.observedTimestamp = observedTimestamp;
    tokenOrder.orderType = orderType;
    tokenOrder.price = price;

    tokenOrder.baseAssetSymbol = splitId[0];
    tokenOrder.baseAssetAddress = radarMarket.baseTokenAddress || null;
    tokenOrder.baseVolume = amount;

    tokenOrder.quoteAssetSymbol = splitId[1];
    tokenOrder.quoteAssetAddress = radarMarket.quoteTokenAddress || null;
    tokenOrder.quoteVolume = price.times(amount);

    tokenOrder.makerAddress = aggregateOrder.makerAddress;
    return tokenOrder;
}

function _toGeneric(radarMarket: RadarMarket, radarOrder: RadarSignedOrder): GenericRawOrder | undefined {
    if (radarMarket.baseTokenDecimals === undefined) {
        return undefined;
    }
    return {
        price: radarOrder.price.toString(),
        // Use the remaining fillable amount
        amount: radarOrder.remainingBaseTokenAmount.toString(),
    };
}

function _aggregateOrdersByMaker(radarMarket: RadarMarket, radarOrders: RadarSignedOrder[]): AggregateOrdersByMaker[] {
    // group all orders by their maker
    const ordersByMaker: ObjectMap<RadarSignedOrder[]> = radarOrders.reduce(
        (acc: ObjectMap<RadarSignedOrder[]>, val: RadarSignedOrder) => {
            const makerAddress = val.signedOrder.makerAddress;
            if (acc[makerAddress]) {
                acc[makerAddress].push(val);
            } else {
                acc[makerAddress] = [];
            }
            return acc;
        },
        {},
    );
    const transformToGeneric = (radarOrder: RadarSignedOrder) => _toGeneric(radarMarket, radarOrder);
    const aggregationTuples: AggregateOrdersByMaker[][] = (R.keys(ordersByMaker) as string[]).map((maker: string) => {
        const generalizedOrders = _removeUndefined(R.map(transformToGeneric, ordersByMaker[maker]));
        const aggregatedOrders = aggregateOrders(generalizedOrders);
        return aggregatedOrders.map((order: [string, BigNumber]) => ({
            makerAddress: maker,
            price: order[0],
            amount: order[1],
        }));
    });
    return R.unnest(aggregationTuples);
}

// tslint:disable-next-line:no-unbound-method
const _removeUndefined = R.reject(R.isNil);
