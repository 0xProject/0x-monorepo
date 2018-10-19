import { EthRPCClient } from '@0x/eth-rpc-client';
import * as chai from 'chai';
import 'mocha';

import { BlockchainLifecycle, web3Factory } from '../src';

const expect = chai.expect;

describe('BlockchainLifecycle tests', () => {
    const provider = web3Factory.getRpcProvider({ shouldUseInProcessGanache: true });
    const ethRPCClient = new EthRPCClient(provider);
    const blockchainLifecycle = new BlockchainLifecycle(ethRPCClient);
    describe('#startAsync/revertAsync', () => {
        it('reverts changes in between', async () => {
            const blockNumberBefore = await ethRPCClient.getBlockNumberAsync();
            await blockchainLifecycle.startAsync();
            await ethRPCClient.mineBlockAsync();
            const blockNumberAfter = await ethRPCClient.getBlockNumberAsync();
            // tslint:disable-next-line:restrict-plus-operands
            expect(blockNumberAfter).to.be.equal(blockNumberBefore + 1);
            await blockchainLifecycle.revertAsync();
            const blockNumberAfterRevert = await ethRPCClient.getBlockNumberAsync();
            expect(blockNumberAfterRevert).to.be.equal(blockNumberBefore);
        });
    });
});
