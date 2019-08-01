import {
    blockchainTests,
    constants,
    describe,
    expect,
    hexRandom,
    LogDecoder,
    testCombinatoriallyWithReferenceFunc,
    uint256Values,
} from '@0x/contracts-test-utils';
import { FillResults, OrderWithoutDomain as Order } from '@0x/types';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    ReferenceFunctions,
    TestExchangeInternalsContract,
    TestExchangeInternalsFillEventArgs,
} from '../src';

// TODO(dorothy-zbornak): Add _settleOrder
blockchainTests.only('Exchange core internal functions', env => {
    const CHAIN_ID = 1337;
    const EMPTY_ORDER: Order = {
        senderAddress: constants.NULL_ADDRESS,
        makerAddress: constants.NULL_ADDRESS,
        takerAddress: constants.NULL_ADDRESS,
        makerFee: constants.ZERO_AMOUNT,
        takerFee: constants.ZERO_AMOUNT,
        makerAssetAmount: constants.ZERO_AMOUNT,
        takerAssetAmount: constants.ZERO_AMOUNT,
        makerAssetData: constants.NULL_BYTES,
        takerAssetData: constants.NULL_BYTES,
        makerFeeAssetData: constants.NULL_BYTES,
        takerFeeAssetData: constants.NULL_BYTES,
        salt: constants.ZERO_AMOUNT,
        feeRecipientAddress: constants.NULL_ADDRESS,
        expirationTimeSeconds: constants.ZERO_AMOUNT,
    };
    let testExchange: TestExchangeInternalsContract;
    let logDecoder: LogDecoder;
    let senderAddress: string;

    before(async () => {
        [ senderAddress ] = await env.getAccountAddressesAsync();
        testExchange = await TestExchangeInternalsContract.deployFrom0xArtifactAsync(
            artifacts.TestExchangeInternals,
            env.provider,
            env.txDefaults,
            new BigNumber(CHAIN_ID),
        );
        logDecoder = new LogDecoder(env.web3Wrapper, artifacts);
    });

    blockchainTests('calculateFillResults', async () => {
        function makeOrder(
            makerAssetAmount: BigNumber,
            takerAssetAmount: BigNumber,
            makerFee: BigNumber,
            takerFee: BigNumber,
        ): Order {
            return {
                ...EMPTY_ORDER,
                makerAssetAmount,
                takerAssetAmount,
                makerFee,
                takerFee,
            };
        }

        async function referenceCalculateFillResultsAsync(
            orderTakerAssetAmount: BigNumber,
            takerAssetFilledAmount: BigNumber,
            otherAmount: BigNumber,
        ): Promise<FillResults> {
            // Note(albrow): Here we are re-using the same value (otherAmount)
            // for order.makerAssetAmount, order.makerFee, and order.takerFee.
            // This should be safe because they are never used with each other
            // in any mathematical operation in either the reference TypeScript
            // implementation or the Solidity implementation of
            // calculateFillResults.
            return ReferenceFunctions.calculateFillResults(
                makeOrder(otherAmount, orderTakerAssetAmount, otherAmount, otherAmount),
                takerAssetFilledAmount,
            );
        }

        async function testCalculateFillResultsAsync(
            orderTakerAssetAmount: BigNumber,
            takerAssetFilledAmount: BigNumber,
            otherAmount: BigNumber,
        ): Promise<FillResults> {
            const order = makeOrder(otherAmount, orderTakerAssetAmount, otherAmount, otherAmount);
            return testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount);
        }

        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'calculateFillResults',
                referenceCalculateFillResultsAsync,
                testCalculateFillResultsAsync,
                [uint256Values, uint256Values, uint256Values],
            );
        });
    });

    blockchainTests.resets('updateFilledState', async () => {
        const ONE_ETHER = new BigNumber(1e18);
        const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
        const randomHash = () => hexRandom(constants.WORD_LENGTH);
        const randomAssetData = () => hexRandom(36);
        const ORDER_DEFAULTS = {
            senderAddress: randomAddress(),
            makerAddress: randomAddress(),
            takerAddress: randomAddress(),
            makerFee: ONE_ETHER.times(0.001),
            takerFee: ONE_ETHER.times(0.003),
            makerAssetAmount: ONE_ETHER,
            takerAssetAmount: ONE_ETHER.times(0.5),
            makerAssetData: randomAssetData(),
            takerAssetData: randomAssetData(),
            makerFeeAssetData: randomAssetData(),
            takerFeeAssetData: randomAssetData(),
            salt: new BigNumber(_.random(0, 1e8)),
            feeRecipientAddress: randomAddress(),
            expirationTimeSeconds: new BigNumber(_.random(0, 1e8)),
        };

        function makeOrder(details?: Partial<Order>): Order {
            return _.assign(
                {},
                ORDER_DEFAULTS,
                details,
            );
        }

        async function testUpdateFilledStateAsync(
            order: Order,
            orderTakerAssetFilledAmount: BigNumber,
            takerAddress: string,
            takerAssetFillAmount: BigNumber,
        ): Promise<void> {
            const orderHash = randomHash();
            const fillResults = ReferenceFunctions.calculateFillResults(
                order,
                takerAssetFillAmount,
            );
            const expectedFilledState = orderTakerAssetFilledAmount.plus(takerAssetFillAmount);
            // CAll `testUpdateFilledState()`, which will set the `filled`
            // state for this order to `orderTakerAssetFilledAmount` before
            // calling `_updateFilledState()`.
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await testExchange.testUpdateFilledState.sendTransactionAsync(
                    order,
                    takerAddress,
                    orderHash,
                    orderTakerAssetFilledAmount,
                    fillResults,
                ),
            );
            // Grab the new `filled` state for this order.
            const actualFilledState = await testExchange.filled.callAsync(orderHash);
            // Assert the `filled` state for this order.
            expect(actualFilledState).to.bignumber.eq(expectedFilledState);
            // Assert the logs.
            const fillEvent = receipt.logs[0] as LogWithDecodedArgs<TestExchangeInternalsFillEventArgs>;
            expect(fillEvent.event).to.eq('Fill');
            expect(fillEvent.args.makerAddress).to.eq(order.makerAddress);
            expect(fillEvent.args.feeRecipientAddress).to.eq(order.feeRecipientAddress);
            expect(fillEvent.args.makerAssetData).to.eq(order.makerAssetData);
            expect(fillEvent.args.takerAssetData).to.eq(order.takerAssetData);
            expect(fillEvent.args.makerFeeAssetData).to.eq(order.makerFeeAssetData);
            expect(fillEvent.args.takerFeeAssetData).to.eq(order.takerFeeAssetData);
            expect(fillEvent.args.makerAssetFilledAmount).to.bignumber.eq(fillResults.makerAssetFilledAmount);
            expect(fillEvent.args.takerAssetFilledAmount).to.bignumber.eq(fillResults.takerAssetFilledAmount);
            expect(fillEvent.args.makerFeePaid).to.bignumber.eq(fillResults.makerFeePaid);
            expect(fillEvent.args.takerFeePaid).to.bignumber.eq(fillResults.takerFeePaid);
            expect(fillEvent.args.takerAddress).to.eq(takerAddress);
            expect(fillEvent.args.senderAddress).to.eq(senderAddress);
            expect(fillEvent.args.orderHash).to.eq(orderHash);
        }

        it('emits a `Fill` event and updates `filled` state correctly', async () => {
            const order = makeOrder();
            return testUpdateFilledStateAsync(
                order,
                order.takerAssetAmount.times(0.1),
                randomAddress(),
                order.takerAssetAmount.times(0.25),
            );
        });

        it('throws if `leftOrderTakerAssetFilledAmount + fillResults.takerAssetFilledAmount` overflows', async () => {
            const order = makeOrder();
            const orderTakerAssetFilledAmount = constants.MAX_UINT256.dividedToIntegerBy(2);
            const takerAssetFillAmount = constants.MAX_UINT256.dividedToIntegerBy(2).plus(2);
            const fillResults = {
                makerAssetFilledAmount: constants.ZERO_AMOUNT,
                takerAssetFilledAmount: takerAssetFillAmount,
                makerFeePaid: constants.ZERO_AMOUNT,
                takerFeePaid: constants.ZERO_AMOUNT,
            };
            const expectedError = new SafeMathRevertErrors.SafeMathError(
                SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                orderTakerAssetFilledAmount,
                takerAssetFillAmount,
            );
            return expect(testExchange.testUpdateFilledState.awaitTransactionSuccessAsync(
                order,
                randomAddress(),
                randomHash(),
                orderTakerAssetFilledAmount,
                fillResults,
            )).to.revertWith(expectedError);
        });
    });
});
// tslint:disable-line:max-file-line-count
