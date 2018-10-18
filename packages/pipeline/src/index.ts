import { HttpClient } from '@0x/connect';
import { web3Factory } from '@0x/dev-utils';
import 'reflect-metadata';
import { Connection, createConnection } from 'typeorm';

import { ExchangeEventsSource } from './data_sources/contract-wrappers/exchange_events';
import { SraOrder } from './entities/SraOrder';
import { config } from './ormconfig';
import { parseExchangeEvents } from './parsers/events';
import { parseSraOrders } from './parsers/sra_orders';

let connection: Connection;

(async () => {
    connection = await createConnection(config);
    await getExchangeEventsAsync();
    // await getSraOrdersAsync();
})();

// TODO(albrow): Separately: Errors do not appear to be handled correctly. If you use the
// wrong rpcUrl it just returns early with no error.
async function getExchangeEventsAsync(): Promise<void> {
    const provider = web3Factory.getRpcProvider({
        rpcUrl: 'https://mainnet.infura.io',
    });
    const exchangeEvents = new ExchangeEventsSource(provider, 1);
    const eventLogs = await exchangeEvents.getFillEventsAsync();
    const events = parseExchangeEvents(eventLogs);
    console.log('Got events: ' + events.length);
    for (const event of events) {
        await event.save();
    }
    console.log('Saved events.');
    console.log('Exiting process');
    process.exit(0);
}

async function getSraOrdersAsync(): Promise<void> {
    const orderRepository = connection.getRepository(SraOrder);
    console.log(`found ${await orderRepository.count()} existing orders`);
    const sraUrl = 'https://api.radarrelay.com/0x/v2';
    const connect = new HttpClient(sraUrl);
    const rawOrders = await connect.getOrdersAsync();
    const orders = parseSraOrders(rawOrders);
    for (const order of orders) {
        order.sourceUrl = sraUrl;
        await order.save();
    }
    console.log(`now there are ${await orderRepository.count()} total orders`);
}
