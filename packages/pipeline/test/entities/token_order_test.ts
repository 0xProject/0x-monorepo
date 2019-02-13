import { BigNumber } from '@0x/utils';
import 'mocha';

import { TokenOrderbookSnapshot } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

const tokenOrderbookSnapshot: TokenOrderbookSnapshot = {
    source: 'ddextest',
    observedTimestamp: Date.now(),
    orderType: 'bid',
    price: new BigNumber(10.1),
    baseAssetSymbol: 'ETH',
    baseAssetAddress: '0x818e6fecd516ecc3849daf6845e3ec868087b755',
    baseVolume: new BigNumber(143),
    quoteAssetSymbol: 'ABC',
    quoteAssetAddress: '0x00923b9a074762b93650716333b3e1473a15048e',
    quoteVolume: new BigNumber(12.3234234),
    makerAddress: null,
};

describe('TokenOrderbookSnapshot entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const tokenOrderbookSnapshotRepository = connection.getRepository(TokenOrderbookSnapshot);
        await testSaveAndFindEntityAsync(tokenOrderbookSnapshotRepository, tokenOrderbookSnapshot);
    });
});
