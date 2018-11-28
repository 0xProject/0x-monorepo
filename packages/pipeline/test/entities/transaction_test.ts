import 'mocha';
import 'reflect-metadata';

import { Transaction } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

// tslint:disable:custom-no-magic-numbers
describe('Transaction entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const transactionRepository = connection.getRepository(Transaction);
        const transaction = new Transaction();
        transaction.blockHash = '0x6ff106d00b6c3746072fc06bae140fb2549036ba7bcf9184ae19a42fd33657fd';
        transaction.blockNumber = 6276262;
        transaction.gasPrice = 3000000;
        transaction.gasUsed = 125000;
        transaction.transactionHash = '0x6dd106d002873746072fc5e496dd0fb2541b68c77bcf9184ae19a42fd33657fe';
        await testSaveAndFindEntityAsync(transactionRepository, transaction);
    });
});
