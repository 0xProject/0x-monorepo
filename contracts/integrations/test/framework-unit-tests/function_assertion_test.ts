import { blockchainTests, constants, expect, filterLogsToArguments, hexRandom } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { artifacts, TestFrameworkContract, TestFrameworkSomeEventEventArgs, TestFrameworkEvents } from '../../src';
import { FunctionAssertion, Result } from '../utils/function_assertions';

blockchainTests.resets('FunctionAssertion Unit Tests', env => {
    let exampleContract: TestFrameworkContract;

    function randomBigNumber(): BigNumber {
        return new BigNumber(hexRandom(constants.WORD_LENGTH));
    }

    before(async () => {
        exampleContract = await TestFrameworkContract.deployFrom0xArtifactAsync(
            artifacts.TestFramework,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('runAsync', () => {
        it('should call the before function with the provided arguments', async () => {
            let beforeIntrospectionObject = constants.ZERO_AMOUNT;
            const assertion = new FunctionAssertion(exampleContract.noEffect, {
                before: async (returnValue: BigNumber) => {
                    beforeIntrospectionObject = returnValue;
                },
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {},
            });

            const randomInput = randomBigNumber();
            await assertion.runAsync(randomInput);
            expect(beforeIntrospectionObject).bignumber.to.be.eq(randomInput);
        });

        it('should call the after function with the provided arguments', async () => {
            let afterIntrospectionObject = constants.ZERO_AMOUNT;
            const assertion = new FunctionAssertion(exampleContract.noEffect, {
                before: async (returnValue: BigNumber) => {},
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {
                    afterIntrospectionObject = returnValue;
                },
            });

            const randomInput = randomBigNumber();
            await assertion.runAsync(randomInput);
            expect(afterIntrospectionObject).bignumber.to.be.eq(randomInput);
        });

        it('should not fail immediately if the wrapped function fails', async () => {
            await exampleContract.setCounter.awaitTransactionSuccessAsync(new BigNumber(1));
            const assertion = new FunctionAssertion(exampleContract.revertSideEffect, {
                before: async (returnValue: BigNumber) => {},
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {},
            });
            const randomInput = randomBigNumber();
            await assertion.runAsync(randomInput);
        });

        it('should pass the return value from "before" to "after"', async () => {
            const randomInput = randomBigNumber();
            let afterIntrospectionObject = constants.ZERO_AMOUNT;
            const assertion = new FunctionAssertion(exampleContract.noEffect, {
                before: async (returnValue: BigNumber) => {
                    return randomInput;
                },
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {
                    afterIntrospectionObject = beforeInfo;
                },
            });
            await assertion.runAsync(randomInput);
            expect(afterIntrospectionObject).bignumber.to.be.eq(randomInput);
        });

        it('should pass the result from the function call to "after"', async () => {
            let afterIntrospectionObject = constants.ZERO_AMOUNT;
            const assertion = new FunctionAssertion(exampleContract.revertSideEffect, {
                before: async (returnValue: BigNumber) => {},
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {
                    afterIntrospectionObject = result.data;
                },
            });
            const randomInput = randomBigNumber();
            await assertion.runAsync(randomInput);
            expect(afterIntrospectionObject).bignumber.to.be.eq(randomInput);
        });

        it('should pass the receipt from the function call to "after"', async () => {
            let afterIntrospectionObject: TransactionReceiptWithDecodedLogs = {} as TransactionReceiptWithDecodedLogs;
            const assertion = new FunctionAssertion(exampleContract.revertSideEffect, {
                before: async (returnValue: BigNumber) => {},
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {
                    if (result.receipt) {
                        afterIntrospectionObject = result.receipt;
                    } else {
                        throw new Error('No receipt received.');
                    }
                },
            });
            const randomInput = randomBigNumber();
            await assertion.runAsync(randomInput);

            // Ensure that the correct events were emitted.
            const [event] = filterLogsToArguments<TestFrameworkSomeEventEventArgs>(
                afterIntrospectionObject.logs,
                TestFrameworkEvents.SomeEvent,
            );
            expect(event).to.be.deep.eq({ someNumber: randomInput });
        });

        it('should pass the error to "after" if the function call fails', async () => {
            let afterIntrospectionObject: Error = new Error('');
            await exampleContract.setCounter.awaitTransactionSuccessAsync(new BigNumber(1));
            const assertion = new FunctionAssertion(exampleContract.revertSideEffect, {
                before: async (returnValue: BigNumber) => {},
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {
                    afterIntrospectionObject = result.data;
                },
            });
            const randomInput = randomBigNumber();
            await assertion.runAsync(randomInput);
            const errorMessage = 'VM Exception while processing transaction: revert Revert';
            expect(afterIntrospectionObject.message).to.be.eq(errorMessage);
        });
    });
});
