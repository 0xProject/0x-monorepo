import 'mocha';
import 'reflect-metadata';

import { OHLCVExternal } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

const ohlcvExternal = {
    exchange: 'CCCAGG',
    fromSymbol: 'ETH',
    toSymbol: 'ZRX',
    startTime: 1543352400000,
    endTime: 1543356000000,
    open: 307.41,
    close: 310.08,
    low: 304.6,
    high: 310.27,
    volumeFrom: 904.6,
    volumeTo: 278238.5,
    source: 'Crypto Compare',
    observedTimestamp: 1543442338074,
};

// tslint:disable:custom-no-magic-numbers
describe('OHLCVExternal entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const repository = connection.getRepository(OHLCVExternal);
        await testSaveAndFindEntityAsync(repository, ohlcvExternal);
    });
});
