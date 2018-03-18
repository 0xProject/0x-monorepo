import { BlockParamLiteral } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import 'mocha';

import { BlockchainLifecycle, web3Factory } from '../src';

const expect = chai.expect;

describe('BlockchainLifecycle tests', () => {
    const web3Provider = web3Factory.getRpcProvider();
    const web3Wrapper = new Web3Wrapper(web3Provider);
    const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
    describe('#startAsync/revertAsync', () => {
        it('reverts changes in between', async () => {
            const blockNumberBefore = await web3Wrapper.getBlockNumberAsync();
            await blockchainLifecycle.startAsync();
            await web3Wrapper.mineBlockAsync();
            const blockNumberAfter = await web3Wrapper.getBlockNumberAsync();
            expect(blockNumberAfter).to.be.equal(blockNumberBefore + 1);
            await blockchainLifecycle.revertAsync();
            const blockNumberAfterRevert = await web3Wrapper.getBlockNumberAsync();
            expect(blockNumberAfterRevert).to.be.equal(blockNumberBefore);
        });
    });
});
