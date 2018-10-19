import { EthRPCClient } from '@0x/eth-rpc-client';
import * as chai from 'chai';
import { BlockParamLiteral } from 'ethereum-types';
import 'mocha';

import { web3Factory } from '../src';

const expect = chai.expect;

describe('RPC tests', () => {
    const provider = web3Factory.getRpcProvider({ shouldUseInProcessGanache: true });
    const ethRPCClient = new EthRPCClient(provider);
    describe('#mineBlockAsync', () => {
        it('increases block number when called', async () => {
            const blockNumberBefore = await ethRPCClient.getBlockNumberAsync();
            await ethRPCClient.mineBlockAsync();
            const blockNumberAfter = await ethRPCClient.getBlockNumberAsync();
            // tslint:disable-next-line:restrict-plus-operands
            expect(blockNumberAfter).to.be.equal(blockNumberBefore + 1);
        });
    });
    describe('#increaseTimeAsync', () => {
        it('increases time when called', async () => {
            const TIME_DELTA = 1000;
            const blockTimestampBefore = await ethRPCClient.getBlockTimestampAsync(BlockParamLiteral.Latest);
            await ethRPCClient.increaseTimeAsync(TIME_DELTA);
            await ethRPCClient.mineBlockAsync();
            const blockTimestampAfter = await ethRPCClient.getBlockTimestampAsync(BlockParamLiteral.Latest);
            // tslint:disable-next-line:restrict-plus-operands
            expect(blockTimestampAfter).to.be.at.least(blockTimestampBefore + TIME_DELTA);
        });
    });
    describe('#takeSnapshotAsync/revertSnapshotAsync', () => {
        it('reverts changes in between', async () => {
            const blockNumberBefore = await ethRPCClient.getBlockNumberAsync();
            const snapshotId = await ethRPCClient.takeSnapshotAsync();
            await ethRPCClient.mineBlockAsync();
            await ethRPCClient.revertSnapshotAsync(snapshotId);
            const blockNumberAfter = await ethRPCClient.getBlockNumberAsync();
            expect(blockNumberAfter).to.be.equal(blockNumberBefore);
        });
    });
});
