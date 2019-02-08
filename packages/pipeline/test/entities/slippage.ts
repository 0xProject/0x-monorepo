import { BigNumber } from '@0x/utils';
import 'mocha';
import * as R from 'ramda';
import 'reflect-metadata';

import { SlippageRecord } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

const slippageRecord = {
    time: 1234,
    symbol: 'ZRX',
    exchange: 'Paradex',
    usdAmount: 10,
    slippage: 0.01
};

// tslint:disable:custom-no-magic-numbers
describe('Slippage entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const slippageRecords = [slippageRecord];
        const slippageRepository = connection.getRepository(SlippageRecord);
        for (const record of slippageRecords) {
            await testSaveAndFindEntityAsync(slippageRepository, record);
        }
    });
});
