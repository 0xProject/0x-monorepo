import { chaiSetup, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { DecodedLogArgs, LogWithDecodedArgs } from 'ethereum-types';

import { artifacts, TestLogDecodingContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('TestLogDecoding', () => {
    let testLogDecodingWithDependencies: TestLogDecodingContract;
    let testLogDecodingDeployedWithoutDependencies: TestLogDecodingContract;
    const expectedEvent = {
        foo: new BigNumber(256),
        bar: '0x1234',
        car: '4321',
    };
    const expectedDownstreamEvent = {
        lorem: new BigNumber(256),
        ipsum: '4321',
    };
    const emptyDependencyList = {};

    before(async () => {
        testLogDecodingDeployedWithoutDependencies = await TestLogDecodingContract.deployFrom0xArtifactAsync(
            artifacts.TestLogDecoding,
            provider,
            txDefaults,
            emptyDependencyList,
        );
        testLogDecodingWithDependencies = await TestLogDecodingContract.deployFrom0xArtifactAsync(
            artifacts.TestLogDecoding,
            provider,
            txDefaults,
            artifacts,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('Decoding Log Arguments', () => {
        it('should decode locally emitted event args when no dependencies are passed into wrapper', async () => {
            const txReceipt = await testLogDecodingDeployedWithoutDependencies.emitEvent.awaitTransactionSuccessAsync();
            expect(txReceipt.logs.length).to.be.equal(1);
            // tslint:disable no-unnecessary-type-assertion
            expect((txReceipt.logs[0] as LogWithDecodedArgs<DecodedLogArgs>).args).to.be.deep.equal(expectedEvent);
        });
        it('should not decode event args when no dependencies are passed into wrapper', async () => {
            const txReceipt = await testLogDecodingDeployedWithoutDependencies.emitEventDownstream.awaitTransactionSuccessAsync();
            expect(txReceipt.logs.length).to.be.equal(1);
            // tslint:disable no-unnecessary-type-assertion
            expect((txReceipt.logs[0] as LogWithDecodedArgs<DecodedLogArgs>).args).to.be.undefined();
        });
        it('should decode args for local but not downstream event when no dependencies are passed into wrapper', async () => {
            const txReceipt = await testLogDecodingDeployedWithoutDependencies.emitEventsLocalAndDownstream.awaitTransactionSuccessAsync();
            expect(txReceipt.logs.length).to.be.equal(2);
            // tslint:disable no-unnecessary-type-assertion
            expect((txReceipt.logs[0] as LogWithDecodedArgs<DecodedLogArgs>).args).to.be.deep.equal(expectedEvent);
            // tslint:disable no-unnecessary-type-assertion
            expect((txReceipt.logs[1] as LogWithDecodedArgs<DecodedLogArgs>).args).to.be.undefined();
        });
        it('should decode locally emitted event args when dependencies are passed into wrapper', async () => {
            const txReceipt = await testLogDecodingWithDependencies.emitEvent.awaitTransactionSuccessAsync();
            expect(txReceipt.logs.length).to.be.equal(1);
            // tslint:disable no-unnecessary-type-assertion
            expect((txReceipt.logs[0] as LogWithDecodedArgs<DecodedLogArgs>).args).to.be.deep.equal(expectedEvent);
        });
        it('should decode downstream event args when dependencies are passed into wrapper', async () => {
            const txReceipt = await testLogDecodingWithDependencies.emitEventDownstream.awaitTransactionSuccessAsync();
            expect(txReceipt.logs.length).to.be.equal(1);
            // tslint:disable no-unnecessary-type-assertion
            expect((txReceipt.logs[0] as LogWithDecodedArgs<DecodedLogArgs>).args).to.be.deep.equal(
                expectedDownstreamEvent,
            );
        });
        it('should decode args for both local and downstream events when dependencies are passed into wrapper', async () => {
            const txReceipt = await testLogDecodingWithDependencies.emitEventsLocalAndDownstream.awaitTransactionSuccessAsync();
            expect(txReceipt.logs.length).to.be.equal(2);
            // tslint:disable no-unnecessary-type-assertion
            expect((txReceipt.logs[0] as LogWithDecodedArgs<DecodedLogArgs>).args).to.be.deep.equal(expectedEvent);
            // tslint:disable no-unnecessary-type-assertion
            expect((txReceipt.logs[1] as LogWithDecodedArgs<DecodedLogArgs>).args).to.be.deep.equal(
                expectedDownstreamEvent,
            );
        });
    });
});
