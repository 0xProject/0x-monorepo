import { BigNumber } from '@0x/utils';
import 'mocha';
import 'reflect-metadata';

import { ERC20ApprovalEvent } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

// tslint:disable:custom-no-magic-numbers
describe('ERC20ApprovalEvent entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const event = new ERC20ApprovalEvent();
        event.tokenAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
        event.blockNumber = 6281577;
        event.rawData = '0x000000000000000000000000000000000000000000000002b9cba5ee21ad3df9';
        event.logIndex = 43;
        event.transactionHash = '0xcb46b19c786376a0a0140d51e3e606a4c4f926d8ca5434e96d2f69d04d8d9c7f';
        event.ownerAddress = '0x0b65c5f6f3a05d6be5588a72b603360773b3fe04';
        event.spenderAddress = '0x448a5065aebb8e423f0896e6c5d525c040f59af3';
        event.amount = new BigNumber('50281464906893835769');
        const blocksRepository = connection.getRepository(ERC20ApprovalEvent);
        await testSaveAndFindEntityAsync(blocksRepository, event);
    });
});
