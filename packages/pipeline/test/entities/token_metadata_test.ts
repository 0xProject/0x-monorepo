import { BigNumber } from '@0x/utils';
import 'mocha';
import 'reflect-metadata';

import { TokenMetadata } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

const metadataWithoutNullFields: TokenMetadata = {
    address: '0xe41d2489571d322189246dafa5ebde1f4699f498',
    authority: 'https://website-api.0xproject.com/tokens',
    decimals: new BigNumber(18),
    symbol: 'ZRX',
    name: '0x',
};

const metadataWithNullFields: TokenMetadata = {
    address: '0xe41d2489571d322189246dafa5ebde1f4699f499',
    authority: 'https://website-api.0xproject.com/tokens',
    decimals: null,
    symbol: null,
    name: null,
};

// tslint:disable:custom-no-magic-numbers
describe('TokenMetadata entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const tokenMetadata = [metadataWithoutNullFields, metadataWithNullFields];
        const tokenMetadataRepository = connection.getRepository(TokenMetadata);
        for (const tokenMetadatum of tokenMetadata) {
            await testSaveAndFindEntityAsync(tokenMetadataRepository, tokenMetadatum);
        }
    });
});
