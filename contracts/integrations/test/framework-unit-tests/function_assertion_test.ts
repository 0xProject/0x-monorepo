import { blockchainTests, constants, expect, filterLogsToArguments, hexRandom } from '@0x/contracts-test-utils';
import { BigNumber, generatePseudoRandom256BitNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { artifacts, TestFrameworkContract, TestFrameworkSomeEventEventArgs, TestFrameworkEvents } from '../../src';
import { FunctionAssertion, Result } from '../utils/function_assertions';

blockchainTests.resets('FunctionAssertion Unit Tests', env => {
    let exampleContract: TestFrameworkContract;

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
            let sideEffectTarget = constants.ZERO_AMOUNT;
            const assertion = new FunctionAssertion(exampleContract.noEffect, {
                before: async (inputValue: BigNumber) => {
                    sideEffectTarget = inputValue;
                },
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {},
            });

            const randomInput = generatePseudoRandom256BitNumber();
            await assertion.runAsync(randomInput);
            expect(sideEffectTarget).bignumber.to.be.eq(randomInput);
        });

        it('should call the after function with the provided arguments', async () => {
            let sideEffectTarget = constants.ZERO_AMOUNT;
            const assertion = new FunctionAssertion(exampleContract.noEffect, {
                before: async (inputValue: BigNumber) => {},
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {
                    sideEffectTarget = returnValue;
                },
            });

            const randomInput = generatePseudoRandom256BitNumber();
            await assertion.runAsync(randomInput);
            expect(sideEffectTarget).bignumber.to.be.eq(randomInput);
        });

        it('should not fail immediately if the wrapped function fails', async () => {
            await exampleContract.setCounter.awaitTransactionSuccessAsync(new BigNumber(1));
            const assertion = new FunctionAssertion(exampleContract.revertSideEffect, {
                before: async (inputValue: BigNumber) => {},
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {},
            });
            const randomInput = generatePseudoRandom256BitNumber();
            await assertion.runAsync(randomInput);
        });

        it('should pass the return value from "before" to "after"', async () => {
            const randomInput = generatePseudoRandom256BitNumber();
            let sideEffectTarget = constants.ZERO_AMOUNT;
            const assertion = new FunctionAssertion(exampleContract.noEffect, {
                before: async (inputValue: BigNumber) => {
                    return randomInput;
                },
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {
                    sideEffectTarget = beforeInfo;
                },
            });
            await assertion.runAsync(randomInput);
            expect(sideEffectTarget).bignumber.to.be.eq(randomInput);
        });

        it('should pass the result from the function call to "after"', async () => {
            let sideEffectTarget = constants.ZERO_AMOUNT;
            const assertion = new FunctionAssertion(exampleContract.revertSideEffect, {
                before: async (inputValue: BigNumber) => {},
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {
                    sideEffectTarget = result.data;
                },
            });
            const randomInput = generatePseudoRandom256BitNumber();
            await assertion.runAsync(randomInput);
            expect(sideEffectTarget).bignumber.to.be.eq(randomInput);
        });

        it('should pass the receipt from the function call to "after"', async () => {
            let sideEffectTarget: TransactionReceiptWithDecodedLogs = {} as TransactionReceiptWithDecodedLogs;
            const assertion = new FunctionAssertion(exampleContract.revertSideEffect, {
                before: async (inputValue: BigNumber) => {},
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {
                    if (result.receipt) {
                        sideEffectTarget = result.receipt;
                    } else {
                        throw new Error('No receipt received.');
                    }
                },
            });
            const randomInput = generatePseudoRandom256BitNumber();
            await assertion.runAsync(randomInput);

            // Ensure that the correct events were emitted.
            const [event] = filterLogsToArguments<TestFrameworkSomeEventEventArgs>(
                sideEffectTarget.logs,
                TestFrameworkEvents.SomeEvent,
            );
            expect(event).to.be.deep.eq({ someNumber: randomInput });
        });

        it('should pass the error to "after" if the function call fails', async () => {
            let sideEffectTarget: Error = new Error('');
            await exampleContract.setCounter.awaitTransactionSuccessAsync(new BigNumber(1));
            const assertion = new FunctionAssertion(exampleContract.revertSideEffect, {
                before: async (inputValue: BigNumber) => {},
                after: async (beforeInfo: any, result: Result, returnValue: BigNumber) => {
                    sideEffectTarget = result.data;
                },
            });
            const randomInput = generatePseudoRandom256BitNumber();
            await assertion.runAsync(randomInput);
            const errorMessage = 'VM Exception while processing transaction: revert Revert';
            expect(sideEffectTarget.message).to.be.eq(errorMessage);
        });
    });
});
