import { blockchainTests, constants, expect, filterLogsToArguments, getRandomInteger } from '@0x/contracts-test-utils';
import { BigNumber, StringRevertError } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';

import { artifacts } from '../../artifacts';
import { TestFrameworkContract, TestFrameworkEventEventArgs, TestFrameworkEvents } from '../../wrappers';
import { FunctionAssertion, FunctionResult } from '../assertions/function_assertion';

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
            const assertion = new FunctionAssertion<[BigNumber], void, BigNumber>(exampleContract, 'returnInteger', {
                before: async (args: [BigNumber], txData: Partial<TxData>) => {
                    sideEffectTarget = randomInput;
                },
            });
            const randomInput = getRandomInteger(ZERO_AMOUNT, MAX_UINT256);
            await assertion.executeAsync([randomInput], {});
            expect(sideEffectTarget).bignumber.to.be.eq(randomInput);
        });

        it('should call the after function with the provided arguments', async () => {
            let sideEffectTarget = ZERO_AMOUNT;
            const assertion = new FunctionAssertion<[BigNumber], void, BigNumber>(exampleContract, 'returnInteger', {
                after: async (
                    _beforeInfo: any,
                    _result: FunctionResult,
                    args: [BigNumber],
                    txData: Partial<TxData>,
                ) => {
                    [sideEffectTarget] = args;
                },
            });
            const randomInput = getRandomInteger(ZERO_AMOUNT, MAX_UINT256);
            await assertion.executeAsync([randomInput], {});
            expect(sideEffectTarget).bignumber.to.be.eq(randomInput);
        });

        it('should not fail immediately if the wrapped function fails', async () => {
            const assertion = new FunctionAssertion<[], {}, void>(exampleContract, 'emptyRevert');
            await assertion.executeAsync([], {});
        });

        it('should pass the return value of "before" to "after"', async () => {
            const randomInput = getRandomInteger(ZERO_AMOUNT, MAX_UINT256);
            let sideEffectTarget = ZERO_AMOUNT;
            const assertion = new FunctionAssertion<[BigNumber], BigNumber, BigNumber>(
                exampleContract,
                'returnInteger',
                {
                    before: async (_args: [BigNumber], _txData: Partial<TxData>) => {
                        return randomInput;
                    },
                    after: async (
                        beforeInfo: any,
                        _result: FunctionResult,
                        _args: [BigNumber],
                        _txData: Partial<TxData>,
                    ) => {
                        sideEffectTarget = beforeInfo;
                    },
                },
            );
            await assertion.executeAsync([randomInput], {});
            expect(sideEffectTarget).bignumber.to.be.eq(randomInput);
        });

        it('should pass the result from the function call to "after"', async () => {
            let sideEffectTarget = ZERO_AMOUNT;
            const assertion = new FunctionAssertion<[BigNumber], void, BigNumber>(exampleContract, 'returnInteger', {
                after: async (
                    _beforeInfo: any,
                    result: FunctionResult,
                    _args: [BigNumber],
                    _txData: Partial<TxData>,
                ) => {
                    sideEffectTarget = result.data;
                },
            });
            const randomInput = getRandomInteger(ZERO_AMOUNT, MAX_UINT256);
            await assertion.executeAsync([randomInput], {});
            expect(sideEffectTarget).bignumber.to.be.eq(randomInput);
        });

        it('should pass the receipt from the function call to "after"', async () => {
            let sideEffectTarget: TransactionReceiptWithDecodedLogs;
            const assertion = new FunctionAssertion<[string], void, void>(exampleContract, 'emitEvent', {
                after: async (_beforeInfo: any, result: FunctionResult, _args: [string], _txData: Partial<TxData>) => {
                    if (result.receipt) {
                        sideEffectTarget = result.receipt;
                    }
                },
            });

            const input = 'emitted data';
            await assertion.executeAsync([input], {});

            // Ensure that the correct events were emitted.
            const [event] = filterLogsToArguments<TestFrameworkEventEventArgs>(
                sideEffectTarget!.logs, // tslint:disable-line:no-non-null-assertion
                TestFrameworkEvents.Event,
            );
            expect(event).to.be.deep.eq({ input });
        });

        it('should pass the error to "after" if the function call fails', async () => {
            let sideEffectTarget: Error;
            const assertion = new FunctionAssertion<[string], void, void>(exampleContract, 'stringRevert', {
                after: async (_beforeInfo: any, result: FunctionResult, _args: [string], _txData: Partial<TxData>) => {
                    sideEffectTarget = result.data;
                },
            });
            const message = 'error message';
            await assertion.executeAsync([message], {});

            const expectedError = new StringRevertError(message);
            return expect(Promise.reject(sideEffectTarget!)).to.revertWith(expectedError); // tslint:disable-line
        });
    });
});
