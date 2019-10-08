import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TxData, TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { artifacts, Condition, FunctionAssertion, GetterCache, TestCacheContract } from '../../src';

// These tests provide examples for how to use the "FunctionAssertion" class to write
// tests for "payable" and "nonpayable" Solidity functions as well as "pure" and "view" functions.
blockchainTests('TestCache', env => {
    let testCache: TestCacheContract;

    before(async () => {
        testCache = await TestCacheContract.deployFrom0xArtifactAsync(
            artifacts.TestCache,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('numberSideEffect', () => {
        let assertion: FunctionAssertion;

        before(async () => {
            const condition = {
                before: async () => {},
                after: async (result: any, receipt: TransactionReceiptWithDecodedLogs | undefined) => {
                    const counter = await testCache.counter.callAsync();
                    expect(result).bignumber.to.be.eq(counter);
                },
            };
            assertion = new FunctionAssertion(testCache.numberSideEffect, condition);
        });

        it('should return the correct counter', async () => {
            await assertion.runAsync();
        });

        it('should return the correct counter', async () => {
            await testCache.setCounter.awaitTransactionSuccessAsync(new BigNumber(2));
            await assertion.runAsync();
        });
    });

    describe('setCounter', () => {
        let assertion: FunctionAssertion;

        before(async () => {
            const condition = {
                before: async (expectedCounter: BigNumber) => {},
                after: async (
                    result: any,
                    receipt: TransactionReceiptWithDecodedLogs | undefined,
                    expectedCounter: BigNumber,
                ) => {
                    const counter = await testCache.counter.callAsync();
                    expect(counter).bignumber.to.be.eq(expectedCounter);
                },
            };
            assertion = new FunctionAssertion(testCache.setCounter, condition);
        });

        it('should correctly set counter to 1', async () => {
            await assertion.runAsync(new BigNumber(1));
        });

        it('should correctly set counter to 1500', async () => {
            await assertion.runAsync(new BigNumber(1500));
        });
    });
});
