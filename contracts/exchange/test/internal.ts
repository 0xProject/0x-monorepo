import { ReferenceFunctions as LibReferenceFunctions } from '@0x/contracts-exchange-libs';
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
import { LibMathRevertErrors } from '@0x/order-utils';
import { FillResults, OrderWithoutDomain as Order } from '@0x/types';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    ReferenceFunctions,
    TestExchangeInternalsContract,
    TestExchangeInternalsFillEventArgs,
    TestExchangeInternalsDispatchTransferFromCalledEventArgs,
} from '../src';

blockchainTests('Exchange core internal functions', env => {
    const CHAIN_ID = 1337;
    const ONE_ETHER = constants.ONE_ETHER;
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
    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const randomHash = () => hexRandom(constants.WORD_LENGTH);
    const randomAssetData = () => hexRandom(36);
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

    blockchainTests('calculateFillResults', () => {
        describe.optional('combinatorial tests', () => {
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

            testCombinatoriallyWithReferenceFunc(
                'calculateFillResults',
                referenceCalculateFillResultsAsync,
                testCalculateFillResultsAsync,
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            const MAX_UINT256_ROOT = constants.MAX_UINT256_ROOT;
            function makeOrder(details?: Partial<Order>): Order {
                return _.assign(
                    {},
                    EMPTY_ORDER,
                    details,
                );
            }

            it('matches the output of the reference function', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: ONE_ETHER.times(2),
                    makerFee: ONE_ETHER.times(0.0023),
                    takerFee: ONE_ETHER.times(0.0025),
                });
                const takerAssetFilledAmount = ONE_ETHER.dividedToIntegerBy(3);
                const expected = ReferenceFunctions.calculateFillResults(order, takerAssetFilledAmount);
                const actual = await testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount);
                expect(actual).to.deep.eq(expected);
            });

            it('reverts if computing `fillResults.makerAssetFilledAmount` overflows', async () => {
                // All values need to be large to ensure we don't trigger a RoundingError.
                const order = makeOrder({
                    makerAssetAmount: MAX_UINT256_ROOT.times(2),
                    takerAssetAmount: MAX_UINT256_ROOT,
                });
                const takerAssetFilledAmount = MAX_UINT256_ROOT;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                    takerAssetFilledAmount,
                    order.makerAssetAmount,
                );
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount))
                    .to.revertWith(expectedError);
            });

            it('reverts if computing `fillResults.makerFeePaid` overflows', async () => {
                // All values need to be large to ensure we don't trigger a RoundingError.
                const order = makeOrder({
                    makerAssetAmount: MAX_UINT256_ROOT,
                    takerAssetAmount: MAX_UINT256_ROOT,
                    makerFee: MAX_UINT256_ROOT.times(11),
                });
                const takerAssetFilledAmount = MAX_UINT256_ROOT.dividedToIntegerBy(10);
                const makerAssetFilledAmount = LibReferenceFunctions.getPartialAmountFloor(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                    makerAssetFilledAmount,
                    order.makerFee,
                );
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount))
                    .to.revertWith(expectedError);
            });

            it('reverts if computing `fillResults.takerFeePaid` overflows', async () => {
                // All values need to be large to ensure we don't trigger a RoundingError.
                const order = makeOrder({
                    makerAssetAmount: MAX_UINT256_ROOT,
                    takerAssetAmount: MAX_UINT256_ROOT,
                    takerFee: MAX_UINT256_ROOT.times(11),
                });
                const takerAssetFilledAmount = MAX_UINT256_ROOT.dividedToIntegerBy(10);
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                    takerAssetFilledAmount,
                    order.takerFee,
                );
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount))
                    .to.revertWith(expectedError);
            });

            it('reverts if `order.makerAssetAmount` is 0', async () => {
                const order = makeOrder({
                    makerAssetAmount: constants.ZERO_AMOUNT,
                    takerAssetAmount: ONE_ETHER,
                });
                const takerAssetFilledAmount = ONE_ETHER;
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount))
                    .to.revertWith(expectedError);
            });

            it('reverts if `order.takerAssetAmount` is 0', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: constants.ZERO_AMOUNT,
                });
                const takerAssetFilledAmount = ONE_ETHER;
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount))
                    .to.revertWith(expectedError);
            });

            it('reverts if there is a rounding error computing `makerAsssetFilledAmount`', async () => {
                const order = makeOrder({
                    makerAssetAmount: new BigNumber(100),
                    takerAssetAmount: ONE_ETHER,
                });
                const takerAssetFilledAmount = order.takerAssetAmount.dividedToIntegerBy(3);
                const expectedError = new LibMathRevertErrors.RoundingError(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount))
                    .to.revertWith(expectedError);
            });

            it('reverts if there is a rounding error computing `makerFeePaid`', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: ONE_ETHER,
                    makerFee: new BigNumber(100),
                });
                const takerAssetFilledAmount = order.takerAssetAmount.dividedToIntegerBy(3);
                const makerAssetFilledAmount = LibReferenceFunctions.getPartialAmountFloor(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                const expectedError = new LibMathRevertErrors.RoundingError(
                    makerAssetFilledAmount,
                    order.makerAssetAmount,
                    order.makerFee,
                );
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount))
                    .to.revertWith(expectedError);
            });

            it('reverts if there is a rounding error computing `takerFeePaid`', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: ONE_ETHER,
                    takerFee: new BigNumber(100),
                });
                const takerAssetFilledAmount = order.takerAssetAmount.dividedToIntegerBy(3);
                const makerAssetFilledAmount = LibReferenceFunctions.getPartialAmountFloor(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                const expectedError = new LibMathRevertErrors.RoundingError(
                    makerAssetFilledAmount,
                    order.makerAssetAmount,
                    order.takerFee,
                );
                return expect(testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount))
                    .to.revertWith(expectedError);
            });
        });
    });

    blockchainTests.resets('updateFilledState', async () => {
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
            return _.assign({}, ORDER_DEFAULTS, details);
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

        it('reverts if `leftOrderTakerAssetFilledAmount + fillResults.takerAssetFilledAmount` overflows', async () => {
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

    blockchainTests('settleOrder', () => {
        const DEFAULT_ORDER = {
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

        it('calls `_dispatchTransferFrom()` in the right order with the correct arguments', async () => {
            const order = DEFAULT_ORDER;
            const orderHash = randomHash();
            const takerAddress = randomAddress();
            const fillResults = {
                makerAssetFilledAmount: ONE_ETHER.times(2),
                takerAssetFilledAmount: ONE_ETHER.times(10),
                makerFeePaid: ONE_ETHER.times(0.01),
                takerFeePaid: ONE_ETHER.times(0.025),
            };
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await testExchange.settleOrder.sendTransactionAsync(
                    orderHash,
                    order,
                    takerAddress,
                    fillResults,
                ),
            );
            const logs = receipt.logs as Array<LogWithDecodedArgs<TestExchangeInternalsDispatchTransferFromCalledEventArgs>>;
            expect(logs.length === 4);
            expect(_.every(logs, log => log.event === 'DispatchTransferFromCalled')).to.be.true();
            // taker -> maker
            expect(logs[0].args.orderHash).to.eq(orderHash);
            expect(logs[0].args.assetData).to.eq(order.takerAssetData);
            expect(logs[0].args.from).to.eq(takerAddress);
            expect(logs[0].args.to).to.eq(order.makerAddress);
            expect(logs[0].args.amount).to.bignumber.eq(fillResults.takerAssetFilledAmount);
            // maker -> taker
            expect(logs[1].args.orderHash).to.eq(orderHash);
            expect(logs[1].args.assetData).to.eq(order.makerAssetData);
            expect(logs[1].args.from).to.eq(order.makerAddress);
            expect(logs[1].args.to).to.eq(takerAddress);
            expect(logs[1].args.amount).to.bignumber.eq(fillResults.makerAssetFilledAmount);
            // taker fee -> feeRecipient
            expect(logs[2].args.orderHash).to.eq(orderHash);
            expect(logs[2].args.assetData).to.eq(order.takerFeeAssetData);
            expect(logs[2].args.from).to.eq(takerAddress);
            expect(logs[2].args.to).to.eq(order.feeRecipientAddress);
            expect(logs[2].args.amount).to.bignumber.eq(fillResults.takerFeePaid);
            // maker fee -> feeRecipient
            expect(logs[3].args.orderHash).to.eq(orderHash);
            expect(logs[3].args.assetData).to.eq(order.makerFeeAssetData);
            expect(logs[3].args.from).to.eq(order.makerAddress);
            expect(logs[3].args.to).to.eq(order.feeRecipientAddress);
            expect(logs[3].args.amount).to.bignumber.eq(fillResults.makerFeePaid);
        });
    });
});
// tslint:disable-line:max-file-line-count
