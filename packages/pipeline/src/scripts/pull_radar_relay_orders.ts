// tslint:disable:no-console
import { HttpClient } from '@0x/connect';
import * as R from 'ramda';
import 'reflect-metadata';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { SraOrder } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseSraOrders } from '../parsers/sra_orders';
import { handleError } from '../utils';

const RADAR_RELAY_URL = 'https://api.radarrelay.com/0x/v2';
const BATCH_SAVE_SIZE = 1000; // Number of orders to save at once.
const ORDERS_PER_PAGE = 10000; // Number of orders to get per request.

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    await getOrderbook();
    process.exit(0);
})().catch(handleError);

async function getOrderbook(): Promise<void> {
    console.log('Getting all orders...');
    const connectClient = new HttpClient(RADAR_RELAY_URL);
    const rawOrders = await connectClient.getOrdersAsync({
        perPage: ORDERS_PER_PAGE,
    });
    console.log(`Got ${rawOrders.records.length} orders.`);
    console.log('Parsing orders...');
    const orders = R.pipe(parseSraOrders, R.map(setSourceUrl(RADAR_RELAY_URL)))(rawOrders);
    const ordersRepository = connection.getRepository(SraOrder);
    // TODO(albrow): Move batch saving to a utility function to reduce
    // duplicated code.
    for (const ordersBatch of R.splitEvery(BATCH_SAVE_SIZE, orders)) {
        await ordersRepository.save(ordersBatch);
    }
}

const sourceUrlProp = R.lensProp('sourceUrl');

const setSourceUrl = R.curry((sourceURL: string, order: SraOrder): SraOrder => {
    return R.set(sourceUrlProp, sourceURL, order);
});

const firstSeenProp = R.lensProp('firstSeenTimestamp');
const lastUpdatedProp = R.lensProp('lastUpdatedTimestamp');

const setFirstSeen = R.curry((sourceURL: string, order: SraOrder): SraOrder => {
    return R.set(firstSeenTimestampProp, sourceURL, order);
});
