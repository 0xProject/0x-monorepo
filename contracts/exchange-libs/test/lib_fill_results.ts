import {
    blockchainTests,
    constants,
    describe,
    expect,
    testCombinatoriallyWithReferenceFunc,
    uint256Values,
} from '@0x/contracts-test-utils';
import { LibMathRevertErrors } from '@0x/order-utils';
import { FillResults, OrderWithoutDomain as Order } from '@0x/types';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts, ReferenceFunctions, TestLibFillResultsContract } from '../src';

blockchainTests('LibFillResults', env => {
    const { ONE_ETHER, MAX_UINT256 } = constants;
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
    let libsContract: TestLibFillResultsContract;

    before(async () => {
        libsContract = await TestLibFillResultsContract.deployFrom0xArtifactAsync(
            artifacts.TestLibFillResults,
            env.provider,
            env.txDefaults,
        );
    });

    describe('calculateFillResults', () => {
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
                return libsContract.calculateFillResults.callAsync(order, takerAssetFilledAmount);
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
                return _.assign({}, EMPTY_ORDER, details);
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
                const actual = await libsContract.calculateFillResults.callAsync(order, takerAssetFilledAmount);
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
                return expect(libsContract.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });

            it('reverts if computing `fillResults.makerFeePaid` overflows', async () => {
                // All values need to be large to ensure we don't trigger a RoundingError.
                const order = makeOrder({
                    makerAssetAmount: MAX_UINT256_ROOT,
                    takerAssetAmount: MAX_UINT256_ROOT,
                    makerFee: MAX_UINT256_ROOT.times(11),
                });
                const takerAssetFilledAmount = MAX_UINT256_ROOT.dividedToIntegerBy(10);
                const makerAssetFilledAmount = ReferenceFunctions.getPartialAmountFloor(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                    makerAssetFilledAmount,
                    order.makerFee,
                );
                return expect(libsContract.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
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
                return expect(libsContract.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });

            it('reverts if `order.makerAssetAmount` is 0', async () => {
                const order = makeOrder({
                    makerAssetAmount: constants.ZERO_AMOUNT,
                    takerAssetAmount: ONE_ETHER,
                });
                const takerAssetFilledAmount = ONE_ETHER;
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(libsContract.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });

            it('reverts if `order.takerAssetAmount` is 0', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: constants.ZERO_AMOUNT,
                });
                const takerAssetFilledAmount = ONE_ETHER;
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(libsContract.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
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
                return expect(libsContract.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });

            it('reverts if there is a rounding error computing `makerFeePaid`', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: ONE_ETHER,
                    makerFee: new BigNumber(100),
                });
                const takerAssetFilledAmount = order.takerAssetAmount.dividedToIntegerBy(3);
                const makerAssetFilledAmount = ReferenceFunctions.getPartialAmountFloor(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                const expectedError = new LibMathRevertErrors.RoundingError(
                    makerAssetFilledAmount,
                    order.makerAssetAmount,
                    order.makerFee,
                );
                return expect(libsContract.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });

            it('reverts if there is a rounding error computing `takerFeePaid`', async () => {
                const order = makeOrder({
                    makerAssetAmount: ONE_ETHER,
                    takerAssetAmount: ONE_ETHER,
                    takerFee: new BigNumber(100),
                });
                const takerAssetFilledAmount = order.takerAssetAmount.dividedToIntegerBy(3);
                const makerAssetFilledAmount = ReferenceFunctions.getPartialAmountFloor(
                    takerAssetFilledAmount,
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                );
                const expectedError = new LibMathRevertErrors.RoundingError(
                    makerAssetFilledAmount,
                    order.makerAssetAmount,
                    order.takerFee,
                );
                return expect(libsContract.calculateFillResults.callAsync(order, takerAssetFilledAmount)).to.revertWith(
                    expectedError,
                );
            });
        });
    });

    describe('addFillResults', () => {
        describe('explicit tests', () => {
            const DEFAULT_FILL_RESULTS = [
                {
                    makerAssetFilledAmount: ONE_ETHER,
                    takerAssetFilledAmount: ONE_ETHER.times(2),
                    makerFeePaid: ONE_ETHER.times(0.001),
                    takerFeePaid: ONE_ETHER.times(0.002),
                },
                {
                    makerAssetFilledAmount: ONE_ETHER.times(0.01),
                    takerAssetFilledAmount: ONE_ETHER.times(2).times(0.01),
                    makerFeePaid: ONE_ETHER.times(0.001).times(0.01),
                    takerFeePaid: ONE_ETHER.times(0.002).times(0.01),
                },
            ];

            it('matches the output of the reference function', async () => {
                const [a, b] = DEFAULT_FILL_RESULTS;
                const expected = ReferenceFunctions.addFillResults(a, b);
                const actual = await libsContract.addFillResults.callAsync(a, b);
                expect(actual).to.deep.equal(expected);
            });

            it('reverts if computing `makerAssetFilledAmount` overflows', async () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.makerAssetFilledAmount = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                    a.makerAssetFilledAmount,
                    b.makerAssetFilledAmount,
                );
                return expect(libsContract.addFillResults.callAsync(a, b)).to.revertWith(expectedError);
            });

            it('reverts if computing `takerAssetFilledAmount` overflows', async () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.takerAssetFilledAmount = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                    a.takerAssetFilledAmount,
                    b.takerAssetFilledAmount,
                );
                return expect(libsContract.addFillResults.callAsync(a, b)).to.revertWith(expectedError);
            });

            it('reverts if computing `makerFeePaid` overflows', async () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.makerFeePaid = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                    a.makerFeePaid,
                    b.makerFeePaid,
                );
                return expect(libsContract.addFillResults.callAsync(a, b)).to.revertWith(expectedError);
            });

            it('reverts if computing `takerFeePaid` overflows', async () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.takerFeePaid = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                    a.takerFeePaid,
                    b.takerFeePaid,
                );
                return expect(libsContract.addFillResults.callAsync(a, b)).to.revertWith(expectedError);
            });
        });
    });
});
