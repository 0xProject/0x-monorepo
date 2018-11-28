import 'mocha';
import 'reflect-metadata';

import { Block } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

// tslint:disable:custom-no-magic-numbers
describe('Block entity', () => {
    it('save/find a block', async () => {
        const connection = await createDbConnectionOnceAsync();
        const block = new Block();
        block.hash = '0x12345';
        block.number = 1234567;
        block.timestamp = 5432154321;
        const blocksRepository = connection.getRepository(Block);
        await testSaveAndFindEntityAsync(blocksRepository, block);
    });
});
