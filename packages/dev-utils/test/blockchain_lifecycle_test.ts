import { BlockParamLiteral } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import 'mocha';

import { BlockchainLifecycle, RPC, web3Factory } from '../src';

const expect = chai.expect;

describe('BlockchainLifecycle tests', () => {
    const web3 = web3Factory.create();
    const web3Wrapper = new Web3Wrapper(web3.currentProvider);
    const rpc = new RPC();
    const blockchainLifecycle = new BlockchainLifecycle();
    describe('#startAsync/revertAsync', () => {
        it('reverts changes in between', async () => {
            const blockNumberBefore = await web3Wrapper.getBlockNumberAsync();
            await blockchainLifecycle.startAsync();
            await rpc.mineBlockAsync();
            await blockchainLifecycle.revertAsync();
            const blockNumberAfter = await web3Wrapper.getBlockNumberAsync();
            expect(blockNumberAfter).to.be.equal(blockNumberBefore);
        });
    });
});
