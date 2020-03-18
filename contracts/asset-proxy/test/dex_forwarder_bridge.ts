import { ContractTxFunctionObj } from '@0x/contract-wrappers';
import {
    blockchainTests,
    constants,
    expect,
    filterLogsToArguments,
    getRandomInteger,
    randomAddress,
    shortZip,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { BigNumber, hexUtils } from '@0x/utils';
import { DecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { DexForwaderBridgeCall, dexForwarderBridgeDataEncoder } from '../src/dex_forwarder_bridge';

import { artifacts } from './artifacts';
import {
    DexForwarderBridgeEvents,
    TestDexForwarderBridgeBridgeTransferFromCalledEventArgs as BtfCalledEventArgs,
    TestDexForwarderBridgeContract,
    TestDexForwarderBridgeEvents as TestEvents,
} from './wrappers';

const { ZERO_AMOUNT } = constants;

blockchainTests.resets('DexForwaderBridge unit tests', env => {
    let testContract: TestDexForwarderBridgeContract;
    let inputToken: string;
    let outputToken: string;
    const BRIDGE_SUCCESS = '0xdc1600f3';
    const BRIDGE_FAILURE = '0xffffffff';
    const BRIDGE_REVERT_ERROR = 'oopsie';
    const INCOMPLETE_FILL_REVERT = 'DexForwaderBridge/INCOMPLETE_FILL';
    const DEFAULTS = {
        toAddress: randomAddress(),
    };

    before(async () => {
        testContract = await TestDexForwarderBridgeContract.deployFrom0xArtifactAsync(
            artifacts.TestDexForwarderBridge,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        // Create test tokens.
        [inputToken, outputToken] = [
            await callAndTransactAsync(testContract.createToken()),
            await callAndTransactAsync(testContract.createToken()),
        ];
    });

    async function callAndTransactAsync<TResult>(fnCall: ContractTxFunctionObj<TResult>): Promise<TResult> {
        const result = await fnCall.callAsync();
        await fnCall.awaitTransactionSuccessAsync({}, { shouldValidate: false });
        return result;
    }

    function getRandomBridgeCall(
        bridgeAddress: string,
        fields: Partial<DexForwaderBridgeCall> = {},
    ): DexForwaderBridgeCall {
        return {
            target: bridgeAddress,
            inputTokenAmount: getRandomInteger(1, '100e18'),
            outputTokenAmount: getRandomInteger(1, '100e18'),
            bridgeData: hexUtils.leftPad(inputToken),
            ...fields,
        };
    }

    describe('bridgeTransferFrom()', () => {
        let goodBridgeCalls: DexForwaderBridgeCall[];
        let revertingBridgeCall: DexForwaderBridgeCall;
        let failingBridgeCall: DexForwaderBridgeCall;
        let allBridgeCalls: DexForwaderBridgeCall[];
        let totalFillableOutputAmount: BigNumber;
        let totalFillableInputAmount: BigNumber;
        let recipientOutputBalance: BigNumber;

        beforeEach(async () => {
            goodBridgeCalls = [];
            for (let i = 0; i < 4; ++i) {
                goodBridgeCalls.push(await createBridgeCallAsync({ returnCode: BRIDGE_SUCCESS }));
            }
            revertingBridgeCall = await createBridgeCallAsync({ revertError: BRIDGE_REVERT_ERROR });
            failingBridgeCall = await createBridgeCallAsync({ returnCode: BRIDGE_FAILURE });
            allBridgeCalls = _.shuffle([failingBridgeCall, revertingBridgeCall, ...goodBridgeCalls]);

            totalFillableInputAmount = BigNumber.sum(...goodBridgeCalls.map(c => c.inputTokenAmount));
            totalFillableOutputAmount = BigNumber.sum(...goodBridgeCalls.map(c => c.outputTokenAmount));

            // Grant the taker some output tokens.
            await testContract.setTokenBalance(
                outputToken,
                DEFAULTS.toAddress,
                (recipientOutputBalance = getRandomInteger(1, '100e18')),
            );
        });

        async function setForwarderInputBalanceAsync(amount: BigNumber): Promise<void> {
            await testContract
                .setTokenBalance(inputToken, testContract.address, amount)
                .awaitTransactionSuccessAsync({}, { shouldValidate: false });
        }

        async function createBridgeCallAsync(
            opts: Partial<{
                returnCode: string;
                revertError: string;
                callFields: Partial<DexForwaderBridgeCall>;
                outputFillAmount: BigNumber;
            }>,
        ): Promise<DexForwaderBridgeCall> {
            const { returnCode, revertError, callFields, outputFillAmount } = {
                returnCode: BRIDGE_SUCCESS,
                revertError: '',
                ...opts,
            };
            const bridge = await callAndTransactAsync(testContract.createBridge(returnCode, revertError));
            const call = getRandomBridgeCall(bridge, callFields);
            await testContract
                .setBridgeTransferAmount(call.target, outputFillAmount || call.outputTokenAmount)
                .awaitTransactionSuccessAsync({}, { shouldValidate: false });
            return call;
        }

        async function callBridgeTransferFromAsync(opts: {
            bridgeData: string;
            sellAmount?: BigNumber;
            buyAmount?: BigNumber;
        }): Promise<DecodedLogs> {
            // Fund the forwarder with input tokens to sell.
            await setForwarderInputBalanceAsync(opts.sellAmount || totalFillableInputAmount);
            const call = testContract.bridgeTransferFrom(
                outputToken,
                testContract.address,
                DEFAULTS.toAddress,
                opts.buyAmount || totalFillableOutputAmount,
                opts.bridgeData,
            );
            const returnCode = await call.callAsync();
            if (returnCode !== BRIDGE_SUCCESS) {
                throw new Error('Expected BRIDGE_SUCCESS');
            }
            const receipt = await call.awaitTransactionSuccessAsync({}, { shouldValidate: false });
            // tslint:disable-next-line: no-unnecessary-type-assertion
            return receipt.logs as DecodedLogs;
        }

        it('succeeds with no bridge calls and no input balance', async () => {
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls: [],
            });
            await callBridgeTransferFromAsync({ bridgeData, sellAmount: ZERO_AMOUNT });
        });

        it('succeeds with bridge calls and no input balance', async () => {
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls: allBridgeCalls,
            });
            await callBridgeTransferFromAsync({ bridgeData, sellAmount: ZERO_AMOUNT });
        });

        it('fails with no bridge calls and an input balance', async () => {
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls: [],
            });
            return expect(callBridgeTransferFromAsync({ bridgeData, sellAmount: new BigNumber(1) })).to.revertWith(
                INCOMPLETE_FILL_REVERT,
            );
        });

        it('fails if entire input token balance is not consumed', async () => {
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls: allBridgeCalls,
            });
            return expect(
                callBridgeTransferFromAsync({
                    bridgeData,
                    sellAmount: totalFillableInputAmount.plus(1),
                }),
            ).to.revertWith(INCOMPLETE_FILL_REVERT);
        });

        it('succeeds with one bridge call', async () => {
            const calls = goodBridgeCalls.slice(0, 1);
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls,
            });
            await callBridgeTransferFromAsync({ bridgeData, sellAmount: calls[0].inputTokenAmount });
        });

        it('succeeds with many bridge calls', async () => {
            const calls = goodBridgeCalls;
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls,
            });
            await callBridgeTransferFromAsync({ bridgeData });
        });

        it('swallows a failing bridge call', async () => {
            const calls = _.shuffle([...goodBridgeCalls, failingBridgeCall]);
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls,
            });
            await callBridgeTransferFromAsync({ bridgeData });
        });

        it('consumes input tokens for output tokens', async () => {
            const calls = allBridgeCalls;
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls,
            });
            await callBridgeTransferFromAsync({ bridgeData });
            const currentBridgeInputBalance = await testContract
                .balanceOf(inputToken, testContract.address)
                .callAsync();
            expect(currentBridgeInputBalance).to.bignumber.eq(0);
            const currentRecipientOutputBalance = await testContract
                .balanceOf(outputToken, DEFAULTS.toAddress)
                .callAsync();
            expect(currentRecipientOutputBalance).to.bignumber.eq(totalFillableOutputAmount);
        });

        it('emits failure events for failing bridge calls', async () => {
            const calls = [revertingBridgeCall, failingBridgeCall, ...goodBridgeCalls];
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls,
            });
            const logs = await callBridgeTransferFromAsync({ bridgeData });
            verifyEventsFromLogs(
                logs,
                [revertingBridgeCall, failingBridgeCall].map(c => ({
                    inputToken,
                    outputToken,
                    target: c.target,
                    inputTokenAmount: c.inputTokenAmount,
                    outputTokenAmount: c.outputTokenAmount,
                })),
                DexForwarderBridgeEvents.DexForwarderBridgeCallFailed,
            );
        });

        it("transfers only up to each call's input amount to each bridge", async () => {
            const calls = goodBridgeCalls;
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls,
            });
            const logs = await callBridgeTransferFromAsync({ bridgeData });
            const btfs = filterLogsToArguments<BtfCalledEventArgs>(logs, TestEvents.BridgeTransferFromCalled);
            for (const [call, btf] of shortZip(goodBridgeCalls, btfs)) {
                expect(btf.inputTokenBalance).to.bignumber.eq(call.inputTokenAmount);
            }
        });

        it('transfers only up to outstanding sell amount to each bridge', async () => {
            // Prepend an extra bridge call.
            const calls = [
                await createBridgeCallAsync({
                    callFields: {
                        inputTokenAmount: new BigNumber(1),
                        outputTokenAmount: new BigNumber(1),
                    },
                }),
                ...goodBridgeCalls,
            ];
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls,
            });
            const logs = await callBridgeTransferFromAsync({ bridgeData });
            const btfs = filterLogsToArguments<BtfCalledEventArgs>(logs, TestEvents.BridgeTransferFromCalled);
            expect(btfs).to.be.length(goodBridgeCalls.length + 1);
            // The last call will receive 1 less token.
            const lastCall = calls.slice(-1)[0];
            const lastBtf = btfs.slice(-1)[0];
            expect(lastBtf.inputTokenBalance).to.bignumber.eq(lastCall.inputTokenAmount.minus(1));
        });

        it('recoups funds from a bridge that fails', async () => {
            // Prepend a call that will take the whole input amount but will
            // fail.
            const badCall = await createBridgeCallAsync({
                callFields: { inputTokenAmount: totalFillableInputAmount },
                returnCode: BRIDGE_FAILURE,
            });
            const calls = [badCall, ...goodBridgeCalls];
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls,
            });
            const logs = await callBridgeTransferFromAsync({ bridgeData });
            verifyEventsFromLogs(
                logs,
                [
                    {
                        inputToken,
                        outputToken,
                        target: badCall.target,
                        inputTokenAmount: badCall.inputTokenAmount,
                        outputTokenAmount: badCall.outputTokenAmount,
                    },
                ],
                TestEvents.DexForwarderBridgeCallFailed,
            );
            const btfs = filterLogsToArguments<BtfCalledEventArgs>(logs, TestEvents.BridgeTransferFromCalled);
            expect(btfs).to.be.length(goodBridgeCalls.length);
        });

        it('recoups funds from a bridge that reverts', async () => {
            // Prepend a call that will take the whole input amount but will
            // revert.
            const badCall = await createBridgeCallAsync({
                callFields: { inputTokenAmount: totalFillableInputAmount },
                revertError: BRIDGE_REVERT_ERROR,
            });
            const calls = [badCall, ...goodBridgeCalls];
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls,
            });
            const logs = await callBridgeTransferFromAsync({ bridgeData });
            verifyEventsFromLogs(
                logs,
                [
                    {
                        inputToken,
                        outputToken,
                        target: badCall.target,
                        inputTokenAmount: badCall.inputTokenAmount,
                        outputTokenAmount: badCall.outputTokenAmount,
                    },
                ],
                TestEvents.DexForwarderBridgeCallFailed,
            );
            const btfs = filterLogsToArguments<BtfCalledEventArgs>(logs, TestEvents.BridgeTransferFromCalled);
            expect(btfs).to.be.length(goodBridgeCalls.length);
        });

        it('recoups funds from a bridge that under-pays', async () => {
            // Prepend a call that will take the whole input amount but will
            // underpay the output amount..
            const badCall = await createBridgeCallAsync({
                callFields: {
                    inputTokenAmount: totalFillableInputAmount,
                    outputTokenAmount: new BigNumber(2),
                },
                outputFillAmount: new BigNumber(1),
            });
            const calls = [badCall, ...goodBridgeCalls];
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls,
            });
            const logs = await callBridgeTransferFromAsync({ bridgeData });
            verifyEventsFromLogs(
                logs,
                [
                    {
                        inputToken,
                        outputToken,
                        target: badCall.target,
                        inputTokenAmount: badCall.inputTokenAmount,
                        outputTokenAmount: badCall.outputTokenAmount,
                    },
                ],
                TestEvents.DexForwarderBridgeCallFailed,
            );
            const btfs = filterLogsToArguments<BtfCalledEventArgs>(logs, TestEvents.BridgeTransferFromCalled);
            expect(btfs).to.be.length(goodBridgeCalls.length);
        });
    });
});
