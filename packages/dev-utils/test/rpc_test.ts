import { BlockParamLiteral } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import 'mocha';

import { web3Factory } from '../src';

const expect = chai.expect;

describe('RPC tests', () => {
    const web3Provider = web3Factory.getRpcProvider();
    const web3Wrapper = new Web3Wrapper(web3Provider);
    describe('#mineBlockAsync', () => {
        it('increases block number when called', async () => {
            const blockNumberBefore = await web3Wrapper.getBlockNumberAsync();
            await web3Wrapper.mineBlockAsync();
            const blockNumberAfter = await web3Wrapper.getBlockNumberAsync();
            expect(blockNumberAfter).to.be.equal(blockNumberBefore + 1);
        });
    });
    describe('#increaseTimeAsync', () => {
        it('increases time when called', async () => {
            const TIME_DELTA = 1000;
            const blockTimestampBefore = await web3Wrapper.getBlockTimestampAsync(BlockParamLiteral.Latest);
            await web3Wrapper.increaseTimeAsync(TIME_DELTA);
            await web3Wrapper.mineBlockAsync();
            const blockTimestampAfter = await web3Wrapper.getBlockTimestampAsync(BlockParamLiteral.Latest);
            expect(blockTimestampAfter).to.be.at.least(blockTimestampBefore + TIME_DELTA);
        });
    });
    describe('#takeSnapshotAsync/revertSnapshotAsync', () => {
        it('reverts changes in between', async () => {
            const blockNumberBefore = await web3Wrapper.getBlockNumberAsync();
            const snapshotId = await web3Wrapper.takeSnapshotAsync();
            await web3Wrapper.mineBlockAsync();
            await web3Wrapper.revertSnapshotAsync(snapshotId);
            const blockNumberAfter = await web3Wrapper.getBlockNumberAsync();
            expect(blockNumberAfter).to.be.equal(blockNumberBefore);
        });
    });
});
