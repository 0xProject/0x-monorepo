import { BigNumber } from '@0x/utils';
import 'mocha';
import * as R from 'ramda';
import 'reflect-metadata';

import { Slippage } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

const slippage = {
    observedTimestamp: 1549587475793,
    symbol: 'ZRX',
    exchange: 'Radar Relay',
    usdAmount: 10,
    tokenAmount: 25,
    avgPriceInEthBuy: 0.0022,
    avgPriceInEthSell: 0.002,
    slippage: 0.01
};

// tslint:disable:custom-no-magic-numbers
describe('Slippage entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const slippages = [slippage];
        const slippageRepository = connection.getRepository(Slippage);
        for (const slippage of slippages) {
            await testSaveAndFindEntityAsync(slippageRepository, slippage);
        }
    });
});
