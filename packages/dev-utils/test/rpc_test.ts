import { BlockParamLiteral } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import 'mocha';

import { RPC, web3Factory } from '../src';

const expect = chai.expect;

describe('RPC tests', () => {
    const web3 = web3Factory.create();
    const web3Wrapper = new Web3Wrapper(web3.currentProvider);
    const rpc = new RPC();
    describe('#mineBlockAsync', () => {
        it('increases block number when called', async () => {
            const blockNumberBefore = await web3Wrapper.getBlockNumberAsync();
            await rpc.mineBlockAsync();
            const blockNumberAfter = await web3Wrapper.getBlockNumberAsync();
            expect(blockNumberAfter).to.be.equal(blockNumberBefore + 1);
        });
    });
    describe('#increaseTimeAsync', () => {
        it('increases time when called', async () => {
            const TIME_DELTA = 1000;
            const blockTimestamtBefore = await web3Wrapper.getBlockTimestampAsync(BlockParamLiteral.Latest);
            await rpc.increaseTimeAsync(TIME_DELTA);
            await rpc.mineBlockAsync();
            const blockTimestamtAfter = await web3Wrapper.getBlockTimestampAsync(BlockParamLiteral.Latest);
            expect(blockTimestamtAfter).to.be.at.least(blockTimestamtBefore + TIME_DELTA);
        });
    });
    describe('#takeSnapshotAsync/revertSnapshotAsync', () => {
        it('reverts changes in between', async () => {
            const blockNumberBefore = await web3Wrapper.getBlockNumberAsync();
            const snapshotId = await rpc.takeSnapshotAsync();
            await rpc.mineBlockAsync();
            await rpc.revertSnapshotAsync(snapshotId);
            const blockNumberAfter = await web3Wrapper.getBlockNumberAsync();
            expect(blockNumberAfter).to.be.equal(blockNumberBefore);
        });
    });
});
