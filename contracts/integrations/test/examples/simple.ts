import { blockchainTests, expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { artifacts, TestFrameworkContract } from '../../src';
import { FunctionAssertion, Result } from '../utils/function_assertions';

// These tests provide examples for how to use the "FunctionAssertion" class to write
// tests for "payable" and "nonpayable" Solidity functions as well as "pure" and "view" functions.
blockchainTests('TestFramework', env => {
    let exampleContract: TestFrameworkContract;

    before(async () => {
        exampleContract = await TestFrameworkContract.deployFrom0xArtifactAsync(
            artifacts.TestFramework,
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
                after: async (beforeInfo: any, result: Result) => {
                    // Ensure that the call was successful.
                    expect(result.success).to.be.true();

                    // Ensure that the correct counter was returned.
                    const counter = await exampleContract.counter.callAsync();
                    expect(result.data).bignumber.to.be.eq(counter);
                },
            };
            assertion = new FunctionAssertion(exampleContract.numberSideEffect, condition);
        });

        it('should return the correct counter', async () => {
            await assertion.runAsync();
        });

        it('should return the correct counter', async () => {
            await exampleContract.setCounter.awaitTransactionSuccessAsync(new BigNumber(2));
            await assertion.runAsync();
        });
    });

    describe('setCounter', () => {
        let assertion: FunctionAssertion;

        before(async () => {
            const condition = {
                before: async (expectedCounter: BigNumber) => {},
                after: async (beforeInfo: any, result: Result, expectedCounter: BigNumber) => {
                    // Ensure that the call was successful.
                    expect(result.success).to.be.true();

                    // Ensure that the counter was updated correctly.
                    const counter = await exampleContract.counter.callAsync();
                    expect(counter).bignumber.to.be.eq(expectedCounter);
                },
            };
            assertion = new FunctionAssertion(exampleContract.setCounter, condition);
        });

        it('should correctly set counter to 1', async () => {
            await assertion.runAsync(new BigNumber(1));
        });

        it('should correctly set counter to 1500', async () => {
            await assertion.runAsync(new BigNumber(1500));
        });
    });
});
