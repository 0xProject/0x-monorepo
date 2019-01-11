// tslint:disable:no-console
import { HttpClient } from '@0x/connect';
import * as R from 'ramda';
import 'reflect-metadata';
import { Connection, ConnectionOptions, createConnection, EntityManager } from 'typeorm';

import { createObservedTimestampForOrder, SraOrder } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseSraOrders } from '../parsers/sra_orders';
import { handleError } from '../utils';

const RADAR_RELAY_URL = 'https://api.radarrelay.com/0x/v2';
const ORDERS_PER_PAGE = 10000; // Number of orders to get per request.

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    await getOrderbookAsync();
    process.exit(0);
})().catch(handleError);

async function getOrderbookAsync(): Promise<void> {
    console.log('Getting all orders...');
    const connectClient = new HttpClient(RADAR_RELAY_URL);
    const rawOrders = await connectClient.getOrdersAsync({
        perPage: ORDERS_PER_PAGE,
    });
    console.log(`Got ${rawOrders.records.length} orders.`);
    console.log('Parsing orders...');
    // Parse the sra orders, then add source url to each.
    const orders = R.pipe(
        parseSraOrders,
        R.map(setSourceUrl(RADAR_RELAY_URL)),
    )(rawOrders);
    // Save all the orders and update the observed time stamps in a single
    // transaction.
    console.log('Saving orders and updating timestamps...');
    const observedTimestamp = Date.now();
    await connection.transaction(
        async (manager: EntityManager): Promise<void> => {
            for (const order of orders) {
                await manager.save(SraOrder, order);
                const orderObservation = createObservedTimestampForOrder(order, observedTimestamp);
                await manager.save(orderObservation);
            }
        },
    );
}

const sourceUrlProp = R.lensProp('sourceUrl');

/**
 * Sets the source url for a single order. Returns a new order instead of
 * mutating the given one.
 */
const setSourceUrl = R.curry(
    (sourceURL: string, order: SraOrder): SraOrder => {
        return R.set(sourceUrlProp, sourceURL, order);
    },
);
