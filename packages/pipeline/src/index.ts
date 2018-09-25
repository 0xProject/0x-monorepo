import 'reflect-metadata';
import { createConnection } from 'typeorm';

import { Etherscan } from './data_sources/etherscan';
import { ExchangeFillEvent } from './entities/ExchangeFillEvent';
import { config } from './ormconfig';

import { parseExchangeEvents } from './data_types/events/exchange_events';

const etherscan = new Etherscan(process.env.ETHERSCAN_API_KEY as string);
const EXCHANGE_ADDRESS = '0x4f833a24e1f95d70f028921e27040ca56e09ab0b';

(async () => {
    const connection = await createConnection(config);
    const repository = connection.getRepository(ExchangeFillEvent);
    console.log(`found ${await repository.count()} existing fill events`);
    const rawEvents = await etherscan.getContractEventsAsync(EXCHANGE_ADDRESS);
    const events = parseExchangeEvents(rawEvents);
    for (const event of events) {
        await event.save();
    }
    console.log(`now ${await repository.count()} total fill events`);
})();
