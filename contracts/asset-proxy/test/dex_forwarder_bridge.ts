import { ContractTxFunctionObj } from '@0x/contract-wrappers';
import {
    blockchainTests,
    constants,
    expect,
    filterLogsToArguments,
    getRandomInteger,
    randomAddress,
    shortZip,
} from '@0x/contracts-test-utils';
import { BigNumber, hexUtils, NULL_ADDRESS } from '@0x/utils';
import { DecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { DexForwarderBridgeCall, dexForwarderBridgeDataEncoder } from '../src/dex_forwarder_bridge';

import { artifacts } from './artifacts';
import {
    TestDexForwarderBridgeBridgeTransferFromCalledEventArgs as BtfCalledEventArgs,
    TestDexForwarderBridgeContract,
    TestDexForwarderBridgeEvents as TestEvents,
} from './wrappers';

const { ZERO_AMOUNT } = constants;

blockchainTests.resets('DexForwarderBridge unit tests', env => {
    let testContract: TestDexForwarderBridgeContract;
    let inputToken: string;
    let outputToken: string;
    const BRIDGE_SUCCESS = '0xdc1600f3';
    const BRIDGE_FAILURE = '0xffffffff';
    const BRIDGE_REVERT_ERROR = 'oopsie';
    const INCOMPLETE_FILL_REVERT = 'DexForwarderBridge/INCOMPLETE_FILL';
    const NOT_AUTHORIZED_REVERT = 'DexForwarderBridge/SENDER_NOT_AUTHORIZED';
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
        await callAndTransactAsync(testContract.setAuthorized(env.txDefaults.from as string));
    });

    async function callAndTransactAsync<TResult>(fnCall: ContractTxFunctionObj<TResult>): Promise<TResult> {
        const result = await fnCall.callAsync();
        await fnCall.awaitTransactionSuccessAsync({}, { shouldValidate: false });
        return result;
    }

    function getRandomBridgeCall(
        bridgeAddress: string,
        fields: Partial<DexForwarderBridgeCall> = {},
    ): DexForwarderBridgeCall {
        return {
            target: bridgeAddress,
            inputTokenAmount: getRandomInteger(1, '100e18'),
            outputTokenAmount: getRandomInteger(1, '100e18'),
            bridgeData: hexUtils.leftPad(inputToken),
            ...fields,
        };
    }

    describe('bridgeTransferFrom()', () => {
        let goodBridgeCalls: DexForwarderBridgeCall[];
        let revertingBridgeCall: DexForwarderBridgeCall;
        let failingBridgeCall: DexForwarderBridgeCall;
        let allBridgeCalls: DexForwarderBridgeCall[];
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
                callFields: Partial<DexForwarderBridgeCall>;
                outputFillAmount: BigNumber;
            }>,
        ): Promise<DexForwarderBridgeCall> {
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

        it('fails if not authorized', async () => {
            const calls = goodBridgeCalls.slice(0, 1);
            const bridgeData = dexForwarderBridgeDataEncoder.encode({
                inputToken,
                calls,
            });
            await callAndTransactAsync(testContract.setAuthorized(NULL_ADDRESS));
            return expect(callBridgeTransferFromAsync({ bridgeData, sellAmount: new BigNumber(1) })).to.revertWith(
                NOT_AUTHORIZED_REVERT,
            );
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
            const btfs = filterLogsToArguments<BtfCalledEventArgs>(logs, TestEvents.BridgeTransferFromCalled);
            expect(btfs).to.be.length(goodBridgeCalls.length);
        });
    });

    describe('executeBridgeCall()', () => {
        it('cannot be called externally', async () => {
            return expect(
                testContract
                    .executeBridgeCall(
                        randomAddress(),
                        randomAddress(),
                        randomAddress(),
                        randomAddress(),
                        new BigNumber(1),
                        new BigNumber(1),
                        constants.NULL_BYTES,
                    )
                    .callAsync(),
            ).to.revertWith('DexForwarderBridge/ONLY_SELF');
        });
    });
});
