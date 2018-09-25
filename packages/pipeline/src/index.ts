import 'reflect-metadata';
import { createConnection } from 'typeorm';

import { artifacts } from './artifacts';
import { Etherscan } from './data_sources/etherscan';
import { ExchangeFillEvent } from './entities/ExchangeFillEvent';
import { config } from './ormconfig';

import { ExchangeEventHandler } from './data_types/events/event_handlers/exchange_event_handler';

const etherscan = new Etherscan(process.env.ETHERSCAN_API_KEY as string);
const EXCHANGE_ADDRESS = '0x4f833a24e1f95d70f028921e27040ca56e09ab0b';

(async () => {
    const connection = await createConnection(config);
    const repository = connection.getRepository(ExchangeFillEvent);
    console.log(`found ${await repository.count()} existing fill events`);
    const exchangeEventHandler = new ExchangeEventHandler(
        artifacts.Exchange.compilerOutput.abi,
        EXCHANGE_ADDRESS,
        etherscan,
    );
    const events = await exchangeEventHandler.getEventsAsync();
    console.log(JSON.stringify(events, null, 2));
    for (const event of events) {
        // TODO(albrow): remove this check once we can parse all Exchange events
        if (event.address != null) {
            await event.save();
        }
    }
    console.log(`now ${await repository.count()} total fill events`);
})();
