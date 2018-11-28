import { BigNumber } from '@0x/utils';
import 'mocha';
import 'reflect-metadata';

import { ExchangeCancelUpToEvent } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

// tslint:disable:custom-no-magic-numbers
describe('ExchangeCancelUpToEvent entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const cancelUpToEventRepository = connection.getRepository(ExchangeCancelUpToEvent);
        const cancelUpToEvent = new ExchangeCancelUpToEvent();
        cancelUpToEvent.blockNumber = 6276262;
        cancelUpToEvent.contractAddress = '0x4f833a24e1f95d70f028921e27040ca56e09ab0b';
        cancelUpToEvent.logIndex = 42;
        cancelUpToEvent.makerAddress = '0xf6da68519f78b0d0bc93c701e86affcb75c92428';
        cancelUpToEvent.orderEpoch = new BigNumber('123456789123456789');
        cancelUpToEvent.rawData = '0x000000000000000000000000f6da68519f78b0d0bc93c701e86affcb75c92428';
        cancelUpToEvent.senderAddress = '0xf6da68519f78b0d0bc93c701e86affcb75c92428';
        cancelUpToEvent.transactionHash = '0x6dd106d002873746072fc5e496dd0fb2541b68c77bcf9184ae19a42fd33657fe';
        await testSaveAndFindEntityAsync(cancelUpToEventRepository, cancelUpToEvent);
    });
});
