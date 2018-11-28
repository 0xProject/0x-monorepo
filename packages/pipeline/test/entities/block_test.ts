import 'mocha';
import 'reflect-metadata';

import { Block } from '../../src/entities';
import { chaiSetup } from '../utils/chai_setup';

import { createDbConnectionOnceAsync, setUpDbAsync, tearDownDbAsync } from './db_setup';
import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

// tslint:disable:custom-no-magic-numbers
describe('Block entity', () => {
    before(async () => {
        await setUpDbAsync();
    });
    after(async () => {
        await tearDownDbAsync();
    });
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
