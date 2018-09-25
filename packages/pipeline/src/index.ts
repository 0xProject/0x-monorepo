import * as R from 'ramda';
import 'reflect-metadata';
import { createConnection } from 'typeorm';

import { Etherscan } from './data_sources/etherscan';
import { parseExchangeEvents } from './data_types/events/exchange_events';
import { ExchangeCancelEvent } from './entities/ExchangeCancelEvent';
import { ExchangeFillEvent } from './entities/ExchangeFillEvent';
import { config } from './ormconfig';

const etherscan = new Etherscan(process.env.ETHERSCAN_API_KEY as string);
const EXCHANGE_ADDRESS = '0x4f833a24e1f95d70f028921e27040ca56e09ab0b';

(async () => {
    const connection = await createConnection(config);
    const fillRepository = connection.getRepository(ExchangeFillEvent);
    const cancelRepository = connection.getRepository(ExchangeCancelEvent);
    console.log(`found ${await fillRepository.count()} existing fill events`);
    console.log(`found ${await cancelRepository.count()} existing cancel events`);
    const rawEvents = await etherscan.getContractEventsAsync(EXCHANGE_ADDRESS);
    const events = parseExchangeEvents(rawEvents);
    console.log(`got ${events.length} parsed events`);
    for (const event of events) {
        await event.save();
    }
    console.log(`now ${await fillRepository.count()} total fill events`);
    console.log(`now ${await cancelRepository.count()} total cancel events`);
})();
