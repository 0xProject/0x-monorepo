import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { Order, RevertReason, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { TestExchangeInternalsContract } from '../../generated_contract_wrappers/test_exchange_internals';
import { artifacts } from '../utils/artifacts';
import {
    getInvalidOpcodeErrorMessageForCallAsync,
    getRevertReasonOrErrorMessageForSendTransactionAsync,
} from '../utils/assertions';
import { chaiSetup } from '../utils/chai_setup';
import { bytes32Values, testCombinatoriallyWithReferenceFuncAsync, uint256Values } from '../utils/combinatorial_utils';
import { constants } from '../utils/constants';
import { FillResults } from '../utils/types';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);

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
    salt: new BigNumber(0),
    exchangeAddress: constants.NULL_ADDRESS,
    feeRecipientAddress: constants.NULL_ADDRESS,
    expirationTimeSeconds: new BigNumber(0),
};

const emptySignedOrder: SignedOrder = {
    ...emptyOrder,
    signature: '',
};

const overflowErrorForCall = new Error(RevertReason.Uint256Overflow);

describe('Exchange core internal functions', () => {
    let testExchange: TestExchangeInternalsContract;
    let invalidOpcodeErrorForCall: Error | undefined;
    let overflowErrorForSendTransaction: Error | undefined;
    let divisionByZeroErrorForCall: Error | undefined;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        testExchange = await TestExchangeInternalsContract.deployFrom0xArtifactAsync(
            artifacts.TestExchangeInternals,
            provider,
            txDefaults,
        );
        overflowErrorForSendTransaction = new Error(
            await getRevertReasonOrErrorMessageForSendTransactionAsync(RevertReason.Uint256Overflow),
        );
        divisionByZeroErrorForCall = new Error(
            await getRevertReasonOrErrorMessageForSendTransactionAsync(RevertReason.DivisionByZero),
        );
        invalidOpcodeErrorForCall = new Error(await getInvalidOpcodeErrorMessageForCallAsync());
    });
    // Note(albrow): Don't forget to add beforeEach and afterEach calls to reset
    // the blockchain state for any tests which modify it!

    async function referenceGetPartialAmountAsync(
        numerator: BigNumber,
        denominator: BigNumber,
        target: BigNumber,
    ): Promise<BigNumber> {
        if (denominator.eq(0)) {
            throw divisionByZeroErrorForCall;
        }
        const product = numerator.mul(target);
        if (product.greaterThan(MAX_UINT256)) {
            throw overflowErrorForCall;
        }
        return product.dividedToIntegerBy(denominator);
    }

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
                    const newTotal = totalVal.add(singleVal);
                    if (newTotal.greaterThan(MAX_UINT256)) {
                        throw overflowErrorForCall;
                    }
                    return newTotal;
                },
            );
        }
        async function testAddFillResultsAsync(totalValue: BigNumber, singleValue: BigNumber): Promise<FillResults> {
            const totalFillResults = makeFillResults(totalValue);
            const singleFillResults = makeFillResults(singleValue);
            return testExchange.publicAddFillResults.callAsync(totalFillResults, singleFillResults);
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
            return {
                makerAssetFilledAmount: await referenceGetPartialAmountAsync(
                    takerAssetFilledAmount,
                    orderTakerAssetAmount,
                    otherAmount,
                ),
                takerAssetFilledAmount,
                makerFeePaid: await referenceGetPartialAmountAsync(
                    takerAssetFilledAmount,
                    orderTakerAssetAmount,
                    otherAmount,
                ),
                takerFeePaid: await referenceGetPartialAmountAsync(
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
            return testExchange.publicCalculateFillResults.callAsync(order, takerAssetFilledAmount);
        }
        await testCombinatoriallyWithReferenceFuncAsync(
            'calculateFillResults',
            referenceCalculateFillResultsAsync,
            testCalculateFillResultsAsync,
            [uint256Values, uint256Values, uint256Values],
        );
    });

    describe('getPartialAmount', async () => {
        async function testGetPartialAmountAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<BigNumber> {
            return testExchange.publicGetPartialAmount.callAsync(numerator, denominator, target);
        }
        await testCombinatoriallyWithReferenceFuncAsync(
            'getPartialAmount',
            referenceGetPartialAmountAsync,
            testGetPartialAmountAsync,
            [uint256Values, uint256Values, uint256Values],
        );
    });

    describe('getPartialAmountCeil', async () => {
        async function referenceGetPartialAmountCeilAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ) {
            if (denominator.eq(0)) {
                throw new Error('revert DIVISION_BY_ZERO');
            }
            const product = numerator.mul(target);
            const offset = product.add(denominator.sub(1));
            if (offset.greaterThan(MAX_UINT256)) {
                throw overflowErrorForCall;
            }
            const result = offset.dividedToIntegerBy(denominator);
            if (product.mod(denominator).eq(0)) {
                expect(result.mul(denominator)).to.be.bignumber.eq(product);
            } else {
                expect(result.mul(denominator)).to.be.bignumber.gt(product);
            }
            return result;
        }
        async function testGetPartialAmountCeilAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<BigNumber> {
            return testExchange.publicGetPartialAmountCeil.callAsync(numerator, denominator, target);
        }
        await testCombinatoriallyWithReferenceFuncAsync(
            'getPartialAmountCeil',
            referenceGetPartialAmountCeilAsync,
            testGetPartialAmountCeilAsync,
            [uint256Values, uint256Values, uint256Values],
        );
    });

    describe('isRoundingError', async () => {
        async function referenceIsRoundingErrorAsync(
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
            const product = numerator.mul(target);
            const remainder = product.mod(denominator);
            const remainderTimes1000 = remainder.mul('1000');
            const isError = remainderTimes1000.gt(product);
            if (product.greaterThan(MAX_UINT256)) {
                throw overflowErrorForCall;
            }
            if (remainderTimes1000.greaterThan(MAX_UINT256)) {
                throw overflowErrorForCall;
            }
            return isError;
        }
        async function testIsRoundingErrorAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<boolean> {
            return testExchange.publicIsRoundingError.callAsync(numerator, denominator, target);
        }
        await testCombinatoriallyWithReferenceFuncAsync(
            'isRoundingError',
            referenceIsRoundingErrorAsync,
            testIsRoundingErrorAsync,
            [uint256Values, uint256Values, uint256Values],
        );
    });

    describe('updateFilledState', async () => {
        // Note(albrow): Since updateFilledState modifies the state by calling
        // sendTransaction, we must reset the state after each test.
        beforeEach(async () => {
            await blockchainLifecycle.startAsync();
        });
        afterEach(async () => {
            await blockchainLifecycle.revertAsync();
        });
        async function referenceUpdateFilledStateAsync(
            takerAssetFilledAmount: BigNumber,
            orderTakerAssetFilledAmount: BigNumber,
            // tslint:disable-next-line:no-unused-variable
            orderHash: string,
        ): Promise<BigNumber> {
            const totalFilledAmount = takerAssetFilledAmount.add(orderTakerAssetFilledAmount);
            if (totalFilledAmount.greaterThan(MAX_UINT256)) {
                throw overflowErrorForSendTransaction;
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
                await testExchange.publicUpdateFilledState.sendTransactionAsync(
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
