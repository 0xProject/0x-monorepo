import { ExchangeFillEventArgs } from '@0xproject/contract-wrappers';
import { assetDataUtils } from '@0xproject/order-utils';
import { LogWithDecodedArgs } from 'ethereum-types';
import 'reflect-metadata';
import { createConnection } from 'typeorm';

import { artifacts } from './artifacts';
import { Etherscan } from './data-sources/etherscan';
import { ExchangeFillEvent } from './entities/ExchangeFillEvent';
import { config } from './ormconfig';

const etherscan = new Etherscan(process.env.ETHERSCAN_API_KEY as string);

(async () => {
    const connection = await createConnection(config);
    const repository = connection.getRepository(ExchangeFillEvent);
    console.log(`found ${await repository.count()} existing fill events`);
    const events = await etherscan.getContractEventsAsync(
        '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
        artifacts.Exchange.compilerOutput.abi,
    );
    for (const event of events) {
        await repository.save(event);
    }
    console.log(`now ${await repository.count()} total fill events`);
})();
