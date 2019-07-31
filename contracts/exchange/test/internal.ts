import {
    blockchainTests,
    bytes32Values,
    constants,
    expect,
    testCombinatoriallyWithReferenceFuncAsync,
    uint256Values,
} from '@0x/contracts-test-utils';
import { LibMathRevertErrors } from '@0x/order-utils';
import { FillResults, Order, RevertReason, SignedOrder } from '@0x/types';
import { BigNumber, providerUtils, SafeMathRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts, TestExchangeInternalsContract, TestExchangeMathContract } from '../src';

const { MAX_UINT256 } = constants;

const emptyOrder: Order = {
    senderAddress: constants.NULL_ADDRESS,
    makerAddress: constants.NULL_ADDRESS,
    takerAddress: constants.NULL_ADDRESS,
    makerFee: new BigNumber(0),
    takerFee: new BigNumber(0),
    makerAssetAmount: new BigNumber(0),
    takerAssetAmount: new BigNumber(0),
    makerAssetData: '0x',
    takerAssetData: '0x',
    makerFeeAssetData: '0x',
    takerFeeAssetData: '0x',
    salt: new BigNumber(0),
    feeRecipientAddress: constants.NULL_ADDRESS,
    expirationTimeSeconds: new BigNumber(0),
    domain: {
        verifyingContractAddress: constants.NULL_ADDRESS,
        chainId: 0, // To be filled in later.
    },
};

const emptySignedOrder: SignedOrder = {
    ...emptyOrder,
    signature: '',
};

const safeMathErrorForCall = new SafeMathRevertErrors.SafeMathError();

// TODO(dorothy-zbornak): Move this to `exchange-libs` and `utils`.
blockchainTests.resets('Exchange math internal functions', env => {
    let chainId: number;
    let testExchange: TestExchangeMathContract;
    let divisionByZeroErrorForCall: Error | undefined;
    let roundingErrorForCall: Error | undefined;

    before(async () => {
        chainId = await env.getChainIdAsync();
        emptyOrder.domain.chainId = chainId;
        emptySignedOrder.domain.chainId = chainId;

        testExchange = await TestExchangeMathContract.deployFrom0xArtifactAsync(
            artifacts.TestExchangeMath,
            env.provider,
            env.txDefaults,
        );
        divisionByZeroErrorForCall = new Error(RevertReason.DivisionByZero);
        roundingErrorForCall = new Error(RevertReason.RoundingError);
        divisionByZeroErrorForCall = new LibMathRevertErrors.DivisionByZeroError();
        roundingErrorForCall = new LibMathRevertErrors.RoundingError();
    });

    async function referenceIsRoundingErrorFloorAsync(
        numerator: BigNumber,
        denominator: BigNumber,
        target: BigNumber,
    ): Promise<boolean> {
        if (denominator.eq(0)) {
            throw divisionByZeroErrorForCall;
        }
        if (numerator.eq(0)) {
            return false;
        }
        if (target.eq(0)) {
            return false;
        }
        const product = numerator.multipliedBy(target);
        const remainder = product.mod(denominator);
        const remainderTimes1000 = remainder.multipliedBy('1000');
        const isError = remainderTimes1000.gte(product);
        if (product.isGreaterThan(MAX_UINT256)) {
            throw safeMathErrorForCall;
        }
        if (remainderTimes1000.isGreaterThan(MAX_UINT256)) {
            throw safeMathErrorForCall;
        }
        return isError;
    }

    async function referenceIsRoundingErrorCeilAsync(
        numerator: BigNumber,
        denominator: BigNumber,
        target: BigNumber,
    ): Promise<boolean> {
        if (denominator.eq(0)) {
            throw divisionByZeroErrorForCall;
        }
        if (numerator.eq(0)) {
            return false;
        }
        if (target.eq(0)) {
            return false;
        }
        const product = numerator.multipliedBy(target);
        const remainder = product.mod(denominator);
        const error = denominator.minus(remainder).mod(denominator);
        const errorTimes1000 = error.multipliedBy('1000');
        const isError = errorTimes1000.gte(product);
        if (product.isGreaterThan(MAX_UINT256)) {
            throw safeMathErrorForCall;
        }
        if (errorTimes1000.isGreaterThan(MAX_UINT256)) {
            throw safeMathErrorForCall;
        }
        return isError;
    }

    async function referenceSafeGetPartialAmountFloorAsync(
        numerator: BigNumber,
        denominator: BigNumber,
        target: BigNumber,
    ): Promise<BigNumber> {
        if (denominator.eq(0)) {
            throw divisionByZeroErrorForCall;
        }
        const isRoundingError = await referenceIsRoundingErrorFloorAsync(numerator, denominator, target);
        if (isRoundingError) {
            throw roundingErrorForCall;
        }
        const product = numerator.multipliedBy(target);
        if (product.isGreaterThan(MAX_UINT256)) {
            throw safeMathErrorForCall;
        }
        return product.dividedToIntegerBy(denominator);
    }

    describe('getPartialAmountFloor', async () => {
        async function referenceGetPartialAmountFloorAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<BigNumber> {
            if (denominator.eq(0)) {
                throw divisionByZeroErrorForCall;
            }
            const product = numerator.multipliedBy(target);
            if (product.isGreaterThan(MAX_UINT256)) {
                throw safeMathErrorForCall;
            }
            return product.dividedToIntegerBy(denominator);
        }
        async function testGetPartialAmountFloorAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<BigNumber> {
            return testExchange.getPartialAmountFloor.callAsync(numerator, denominator, target);
        }
        await testCombinatoriallyWithReferenceFuncAsync(
            'getPartialAmountFloor',
            referenceGetPartialAmountFloorAsync,
            testGetPartialAmountFloorAsync,
            [uint256Values, uint256Values, uint256Values],
        );
    });

    describe('getPartialAmountCeil', async () => {
        async function referenceGetPartialAmountCeilAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<BigNumber> {
            if (denominator.eq(0)) {
                throw divisionByZeroErrorForCall;
            }
            const product = numerator.multipliedBy(target);
            const offset = product.plus(denominator.minus(1));
            if (offset.isGreaterThan(MAX_UINT256)) {
                throw safeMathErrorForCall;
            }
            const result = offset.dividedToIntegerBy(denominator);
            if (product.mod(denominator).eq(0)) {
                expect(result.multipliedBy(denominator)).to.be.bignumber.eq(product);
            } else {
                expect(result.multipliedBy(denominator)).to.be.bignumber.gt(product);
            }
            return result;
        }
        async function testGetPartialAmountCeilAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<BigNumber> {
            return testExchange.getPartialAmountCeil.callAsync(numerator, denominator, target);
        }
        await testCombinatoriallyWithReferenceFuncAsync(
            'getPartialAmountCeil',
            referenceGetPartialAmountCeilAsync,
            testGetPartialAmountCeilAsync,
            [uint256Values, uint256Values, uint256Values],
        );
    });

    describe('safeGetPartialAmountFloor', async () => {
        async function testSafeGetPartialAmountFloorAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<BigNumber> {
            return testExchange.safeGetPartialAmountFloor.callAsync(numerator, denominator, target);
        }
        await testCombinatoriallyWithReferenceFuncAsync(
            'safeGetPartialAmountFloor',
            referenceSafeGetPartialAmountFloorAsync,
            testSafeGetPartialAmountFloorAsync,
            [uint256Values, uint256Values, uint256Values],
        );
    });

    describe('safeGetPartialAmountCeil', async () => {
        async function referenceSafeGetPartialAmountCeilAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<BigNumber> {
            if (denominator.eq(0)) {
                throw divisionByZeroErrorForCall;
            }
            const isRoundingError = await referenceIsRoundingErrorCeilAsync(numerator, denominator, target);
            if (isRoundingError) {
                throw roundingErrorForCall;
            }
            const product = numerator.multipliedBy(target);
            const offset = product.plus(denominator.minus(1));
            if (offset.isGreaterThan(MAX_UINT256)) {
                throw safeMathErrorForCall;
            }
            const result = offset.dividedToIntegerBy(denominator);
            if (product.mod(denominator).eq(0)) {
                expect(result.multipliedBy(denominator)).to.be.bignumber.eq(product);
            } else {
                expect(result.multipliedBy(denominator)).to.be.bignumber.gt(product);
            }
            return result;
        }
        async function testSafeGetPartialAmountCeilAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<BigNumber> {
            return testExchange.safeGetPartialAmountCeil.callAsync(numerator, denominator, target);
        }
        await testCombinatoriallyWithReferenceFuncAsync(
            'safeGetPartialAmountCeil',
            referenceSafeGetPartialAmountCeilAsync,
            testSafeGetPartialAmountCeilAsync,
            [uint256Values, uint256Values, uint256Values],
        );
    });

    describe('isRoundingErrorFloor', async () => {
        async function testIsRoundingErrorFloorAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<boolean> {
            return testExchange.isRoundingErrorFloor.callAsync(numerator, denominator, target);
        }
        await testCombinatoriallyWithReferenceFuncAsync(
            'isRoundingErrorFloor',
            referenceIsRoundingErrorFloorAsync,
            testIsRoundingErrorFloorAsync,
            [uint256Values, uint256Values, uint256Values],
        );
    });

    describe('isRoundingErrorCeil', async () => {
        async function testIsRoundingErrorCeilAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<boolean> {
            return testExchange.isRoundingErrorCeil.callAsync(numerator, denominator, target);
        }
        await testCombinatoriallyWithReferenceFuncAsync(
            'isRoundingErrorCeil',
            referenceIsRoundingErrorCeilAsync,
            testIsRoundingErrorCeilAsync,
            [uint256Values, uint256Values, uint256Values],
        );
    });
});

// TODO(dorothy-zbornak): Add _settleOrder, _dispatchTransferFrom
blockchainTests.resets('Exchange core internal functions', env => {
    let chainId: number;
    let testExchange: TestExchangeInternalsContract;
    let safeMathErrorForSendTransaction: Error | undefined;
    let divisionByZeroErrorForCall: Error | undefined;
    let roundingErrorForCall: Error | undefined;

    before(async () => {
        chainId = await providerUtils.getChainIdAsync(env.provider);
        emptyOrder.domain.chainId = chainId;
        emptySignedOrder.domain.chainId = chainId;

        testExchange = await TestExchangeInternalsContract.deployFrom0xArtifactAsync(
            artifacts.TestExchangeInternals,
            env.provider,
            env.txDefaults,
            new BigNumber(chainId),
        );
        divisionByZeroErrorForCall = new Error(RevertReason.DivisionByZero);
        roundingErrorForCall = new Error(RevertReason.RoundingError);
        safeMathErrorForSendTransaction = safeMathErrorForCall;
        divisionByZeroErrorForCall = new LibMathRevertErrors.DivisionByZeroError();
        roundingErrorForCall = new LibMathRevertErrors.RoundingError();
    });
    // Note(albrow): Don't forget to add beforeEach and afterEach calls to reset
    // the blockchain state for any tests which modify it!

    async function referenceIsRoundingErrorFloorAsync(
        numerator: BigNumber,
        denominator: BigNumber,
        target: BigNumber,
    ): Promise<boolean> {
        if (denominator.eq(0)) {
            throw divisionByZeroErrorForCall;
        }
        if (numerator.eq(0)) {
            return false;
        }
        if (target.eq(0)) {
            return false;
        }
        const product = numerator.multipliedBy(target);
        const remainder = product.mod(denominator);
        const remainderTimes1000 = remainder.multipliedBy('1000');
        const isError = remainderTimes1000.gte(product);
        if (product.isGreaterThan(MAX_UINT256)) {
            throw safeMathErrorForCall;
        }
        if (remainderTimes1000.isGreaterThan(MAX_UINT256)) {
            throw safeMathErrorForCall;
        }
        return isError;
    }

    async function referenceSafeGetPartialAmountFloorAsync(
        numerator: BigNumber,
        denominator: BigNumber,
        target: BigNumber,
    ): Promise<BigNumber> {
        if (denominator.eq(0)) {
            throw divisionByZeroErrorForCall;
        }
        const isRoundingError = await referenceIsRoundingErrorFloorAsync(numerator, denominator, target);
        if (isRoundingError) {
            throw roundingErrorForCall;
        }
        const product = numerator.multipliedBy(target);
        if (product.isGreaterThan(MAX_UINT256)) {
            throw safeMathErrorForCall;
        }
        return product.dividedToIntegerBy(denominator);
    }

    // TODO(dorothy-zbornak): Move this to `exchange-libs`.
    describe('addFillResults', async () => {
        function makeFillResults(value: BigNumber): FillResults {
            return {
                makerAssetFilledAmount: value,
                takerAssetFilledAmount: value,
                makerFeePaid: value,
                takerFeePaid: value,
            };
        }
        async function referenceAddFillResultsAsync(
            totalValue: BigNumber,
            singleValue: BigNumber,
        ): Promise<FillResults> {
            // Note(albrow): Here, each of totalFillResults and
            // singleFillResults will consist of fields with the same values.
            // This should be safe because none of the fields in a given
            // FillResults are ever used together in a mathemetical operation.
            // They are only used with the corresponding field from *the other*
            // FillResults, which are different.
            const totalFillResults = makeFillResults(totalValue);
            const singleFillResults = makeFillResults(singleValue);
            // HACK(albrow): _.mergeWith mutates the first argument! To
            // workaround this we use _.cloneDeep.
            return _.mergeWith(
                _.cloneDeep(totalFillResults),
                singleFillResults,
                (totalVal: BigNumber, singleVal: BigNumber) => {
                    const newTotal = totalVal.plus(singleVal);
                    if (newTotal.isGreaterThan(MAX_UINT256)) {
                        throw safeMathErrorForCall;
                    }
                    return newTotal;
                },
            );
        }
        async function testAddFillResultsAsync(totalValue: BigNumber, singleValue: BigNumber): Promise<FillResults> {
            const totalFillResults = makeFillResults(totalValue);
            const singleFillResults = makeFillResults(singleValue);
            return testExchange.addFillResults.callAsync(totalFillResults, singleFillResults);
        }
        await testCombinatoriallyWithReferenceFuncAsync(
            'addFillResults',
            referenceAddFillResultsAsync,
            testAddFillResultsAsync,
            [uint256Values, uint256Values],
        );
    });

    describe('calculateFillResults', async () => {
        function makeOrder(
            makerAssetAmount: BigNumber,
            takerAssetAmount: BigNumber,
            makerFee: BigNumber,
            takerFee: BigNumber,
        ): Order {
            return {
                ...emptyOrder,
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
            const makerAssetFilledAmount = await referenceSafeGetPartialAmountFloorAsync(
                takerAssetFilledAmount,
                orderTakerAssetAmount,
                otherAmount,
            );
            const order = makeOrder(otherAmount, orderTakerAssetAmount, otherAmount, otherAmount);
            const orderMakerAssetAmount = order.makerAssetAmount;
            return {
                makerAssetFilledAmount,
                takerAssetFilledAmount,
                makerFeePaid: await referenceSafeGetPartialAmountFloorAsync(
                    makerAssetFilledAmount,
                    orderMakerAssetAmount,
                    otherAmount,
                ),
                takerFeePaid: await referenceSafeGetPartialAmountFloorAsync(
                    takerAssetFilledAmount,
                    orderTakerAssetAmount,
                    otherAmount,
                ),
            };
        }
        async function testCalculateFillResultsAsync(
            orderTakerAssetAmount: BigNumber,
            takerAssetFilledAmount: BigNumber,
            otherAmount: BigNumber,
        ): Promise<FillResults> {
            const order = makeOrder(otherAmount, orderTakerAssetAmount, otherAmount, otherAmount);
            return testExchange.calculateFillResults.callAsync(order, takerAssetFilledAmount);
        }
        await testCombinatoriallyWithReferenceFuncAsync(
            'calculateFillResults',
            referenceCalculateFillResultsAsync,
            testCalculateFillResultsAsync,
            [uint256Values, uint256Values, uint256Values],
        );
    });

    blockchainTests.resets('updateFilledState', async ({ web3Wrapper }) => {
        async function referenceUpdateFilledStateAsync(
            takerAssetFilledAmount: BigNumber,
            orderTakerAssetFilledAmount: BigNumber,
            // tslint:disable-next-line:no-unused-variable
            orderHash: string,
        ): Promise<BigNumber> {
            const totalFilledAmount = takerAssetFilledAmount.plus(orderTakerAssetFilledAmount);
            if (totalFilledAmount.isGreaterThan(MAX_UINT256)) {
                // FIXME throw safeMathErrorForSendTransaction(takerAssetFilledAmount, orderTakerAssetFilledAmount);
                throw safeMathErrorForSendTransaction;
            }
            return totalFilledAmount;
        }
        async function testUpdateFilledStateAsync(
            takerAssetFilledAmount: BigNumber,
            orderTakerAssetFilledAmount: BigNumber,
            orderHash: string,
        ): Promise<BigNumber> {
            const fillResults = {
                makerAssetFilledAmount: new BigNumber(0),
                takerAssetFilledAmount,
                makerFeePaid: new BigNumber(0),
                takerFeePaid: new BigNumber(0),
            };
            await web3Wrapper.awaitTransactionSuccessAsync(
                await testExchange.updateFilledState.sendTransactionAsync(
                    emptySignedOrder,
                    constants.NULL_ADDRESS,
                    orderHash,
                    orderTakerAssetFilledAmount,
                    fillResults,
                ),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            return testExchange.filled.callAsync(orderHash);
        }
        await testCombinatoriallyWithReferenceFuncAsync(
            'updateFilledState',
            referenceUpdateFilledStateAsync,
            testUpdateFilledStateAsync,
            [uint256Values, uint256Values, bytes32Values],
        );
    });
});
// tslint:disable-line:max-file-line-count
