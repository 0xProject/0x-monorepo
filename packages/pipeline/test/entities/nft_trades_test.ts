import { BigNumber } from '@0x/utils';
import 'mocha';
import 'reflect-metadata';

import { NftTrade } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

const baseTrade: NftTrade = {
    sourceUrl: 'https://nonfungible.com/api/v1',
    assetDescriptor: 'Kitty #1002',
    assetId: '1002',
    blockNumber: 4608542,
    blockTimestamp: 1543544083704,
    buyerAddress: '0x316c55d1895a085c4b39a98ecb563f509301aaf7',
    logIndex: 28,
    marketAddress: '0xb1690C08E213a35Ed9bAb7B318DE14420FB57d8C',
    meta: {
        cattribute_body: 'munchkin',
        cattribute_coloreyes: 'mintgreen',
        cattribute_colorprimary: 'orangesoda',
        cattribute_colorsecondary: 'coffee',
        cattribute_colortertiary: 'kittencream',
        cattribute_eyes: 'thicccbrowz',
        cattribute_mouth: 'soserious',
        cattribute_pattern: 'totesbasic',
        generation: '0',
        is_exclusive: false,
        is_fancy: false,
    },
    sellerAddress: '0xba52c75764d6f594735dc735be7f1830cdf58ddf',
    totalPrice: new BigNumber('9751388888888889'),
    transactionHash: '0x468168419be7e442d5ff32d264fab24087b744bc2e37fdbac7024e1e74f4c6c8',
    usdPrice: new BigNumber('3.71957'),
};

// tslint:disable:custom-no-magic-numbers
describe('NftTrade entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const tradesRepository = connection.getRepository(NftTrade);
        await testSaveAndFindEntityAsync(tradesRepository, baseTrade);
    });
});
