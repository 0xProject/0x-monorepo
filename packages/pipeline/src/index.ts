import { HttpClient } from '@0xproject/connect';
import 'reflect-metadata';
import { Connection, createConnection } from 'typeorm';

import { Etherscan } from './data_sources/etherscan';
import { parseExchangeEvents } from './data_types/events/exchange_events';
import { parseSraOrders } from './data_types/sra_orders';
import { ExchangeCancelEvent } from './entities/ExchangeCancelEvent';
import { ExchangeCancelUpToEvent } from './entities/ExchangeCancelUpToEvent';
import { ExchangeFillEvent } from './entities/ExchangeFillEvent';
import { SraOrder } from './entities/SraOrder';
import { config } from './ormconfig';

const etherscan = new Etherscan(process.env.ETHERSCAN_API_KEY as string);
const EXCHANGE_ADDRESS = '0x4f833a24e1f95d70f028921e27040ca56e09ab0b';

let connection: Connection;

(async () => {
    connection = await createConnection(config);
    await getExchangeEventsAsync();
    await getSraOrdersAsync();
})();

async function getExchangeEventsAsync(): Promise<void> {
    const fillRepository = connection.getRepository(ExchangeFillEvent);
    const cancelRepository = connection.getRepository(ExchangeCancelEvent);
    const cancelUpToRepository = connection.getRepository(ExchangeCancelUpToEvent);
    console.log(
        `found ${(await fillRepository.count()) +
            (await cancelRepository.count()) +
            (await cancelUpToRepository.count())} existing events`,
    );
    const rawEvents = await etherscan.getContractEventsAsync(EXCHANGE_ADDRESS);
    const events = parseExchangeEvents(rawEvents);
    for (const event of events) {
        await event.save();
    }
    console.log(
        `now there are ${(await fillRepository.count()) +
            (await cancelRepository.count()) +
            (await cancelUpToRepository.count())} total events`,
    );
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
