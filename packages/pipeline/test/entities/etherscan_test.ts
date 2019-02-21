import { BigNumber } from '@0x/utils';
import 'mocha';
import 'reflect-metadata';

import { EtherscanTransaction } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

const transaction: EtherscanTransaction = {
    blockNumber: new BigNumber('6271590'),
    timeStamp: new BigNumber('1536083185'),
    hash: '0x4a03044699c2fbd256e21632a6d8fbfc27655ea711157fa8b2b917f0eb954cea',
    nonce: 2,
    blockHash: '0xee634af4cebd034ed9e5e3dc873a2b0ecc60fe11bef27f7b92542388869f21ee',
    transactionIndex: 3,
    from: '0x2d7dc2ef7c6f6a2cbc3dba4db97b2ddb40e20713',
    to: '',
    value: new BigNumber('0'),
    gas: new BigNumber('7000000'),
    gasPrice: new BigNumber('20000000000'),
    isError: false,
    txreceiptStatus: '1',
    input: '0x60806040', // shortened
    contractAddress: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
    cumulativeGasUsed: new BigNumber('6068925'),
    gasUsed: new BigNumber('6005925'),
    confirmations: new BigNumber('976529'),
};

// tslint:disable:custom-no-magic-numbers
describe('EtherscanTransaction entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const transactions = [transaction];
        const tradesRepository = connection.getRepository(EtherscanTransaction);
        for (const tx of transactions) {
            await testSaveAndFindEntityAsync(tradesRepository, tx);
        }
    });
});
