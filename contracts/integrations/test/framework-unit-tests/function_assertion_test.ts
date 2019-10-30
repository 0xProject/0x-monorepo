import { blockchainTests, constants, expect, filterLogsToArguments, getRandomInteger } from '@0x/contracts-test-utils';
import { BigNumber, StringRevertError } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { artifacts, TestFrameworkContract, TestFrameworkEventEventArgs, TestFrameworkEvents } from '../../src';
import { FunctionAssertion, Result } from '../utils/function_assertions';

const { ZERO_AMOUNT, MAX_UINT256 } = constants;

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

    describe('executeAsync', () => {
        it('should call the before function with the provided arguments', async () => {
            let sideEffectTarget = ZERO_AMOUNT;
            const assertion = new FunctionAssertion(exampleContract.returnInteger, {
                before: async (_input: BigNumber) => {
                    sideEffectTarget = randomInput;
                },
                after: async (_beforeInfo: any, _result: Result, _input: BigNumber) => null,
            });
            const randomInput = getRandomInteger(ZERO_AMOUNT, MAX_UINT256);
            await assertion.executeAsync(randomInput);
            expect(sideEffectTarget).bignumber.to.be.eq(randomInput);
        });

        it('should call the after function with the provided arguments', async () => {
            let sideEffectTarget = ZERO_AMOUNT;
            const assertion = new FunctionAssertion(exampleContract.returnInteger, {
                before: async (_input: BigNumber) => null,
                after: async (_beforeInfo: any, _result: Result, input: BigNumber) => {
                    sideEffectTarget = input;
                },
            });
            const randomInput = getRandomInteger(ZERO_AMOUNT, MAX_UINT256);
            await assertion.executeAsync(randomInput);
            expect(sideEffectTarget).bignumber.to.be.eq(randomInput);
        });

        it('should not fail immediately if the wrapped function fails', async () => {
            const assertion = new FunctionAssertion(exampleContract.emptyRevert, {
                before: async () => null,
                after: async (_beforeInfo: any, _result: Result) => null,
            });
            await assertion.executeAsync();
        });

        it('should pass the return value of "before" to "after"', async () => {
            const randomInput = getRandomInteger(ZERO_AMOUNT, MAX_UINT256);
            let sideEffectTarget = ZERO_AMOUNT;
            const assertion = new FunctionAssertion(exampleContract.returnInteger, {
                before: async (_input: BigNumber) => {
                    return randomInput;
                },
                after: async (beforeInfo: any, _result: Result, _input: BigNumber) => {
                    sideEffectTarget = beforeInfo;
                },
            });
            await assertion.executeAsync(randomInput);
            expect(sideEffectTarget).bignumber.to.be.eq(randomInput);
        });

        it('should pass the result from the function call to "after"', async () => {
            let sideEffectTarget = ZERO_AMOUNT;
            const assertion = new FunctionAssertion(exampleContract.returnInteger, {
                before: async (_input: BigNumber) => null,
                after: async (_beforeInfo: any, result: Result, _input: BigNumber) => {
                    sideEffectTarget = result.data;
                },
            });
            const randomInput = getRandomInteger(ZERO_AMOUNT, MAX_UINT256);
            await assertion.executeAsync(randomInput);
            expect(sideEffectTarget).bignumber.to.be.eq(randomInput);
        });

        it('should pass the receipt from the function call to "after"', async () => {
            let sideEffectTarget: TransactionReceiptWithDecodedLogs;
            const assertion = new FunctionAssertion(exampleContract.emitEvent, {
                before: async (_input: string) => null,
                after: async (_beforeInfo: any, result: Result, _input: string) => {
                    if (result.receipt) {
                        sideEffectTarget = result.receipt;
                    }
                },
            });

            const input = 'emitted data';
            await assertion.executeAsync(input);

            // Ensure that the correct events were emitted.
            const [event] = filterLogsToArguments<TestFrameworkEventEventArgs>(
                sideEffectTarget!.logs, // tslint:disable-line:no-non-null-assertion
                TestFrameworkEvents.Event,
            );
            expect(event).to.be.deep.eq({ input });
        });

        it('should pass the error to "after" if the function call fails', async () => {
            let sideEffectTarget: Error;
            const assertion = new FunctionAssertion(exampleContract.stringRevert, {
                before: async _string => null,
                after: async (_beforeInfo: any, result: Result, _input: string) => {
                    sideEffectTarget = result.data;
                },
            });
            const message = 'error message';
            await assertion.executeAsync(message);

            const expectedError = new StringRevertError(message);
            return expect(
                new Promise<Error>((_resolve, reject) => {
                    reject(sideEffectTarget);
                }),
            ).to.revertWith(expectedError);
        });
    });
});
