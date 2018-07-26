import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { Order, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { TestExchangeInternalsContract } from '../../generated_contract_wrappers/test_exchange_internals';
import { artifacts } from '../utils/artifacts';
import { getGanacheOrGethError } from '../utils/assertions';
import { chaiSetup } from '../utils/chai_setup';
import { bytes32Values, testCombinatoriallyWithReferenceFuncAsync, uint256Values } from '../utils/combinatorial_sets';
import { constants } from '../utils/constants';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);

const emptyOrder: Order = {
    senderAddress: '0x0000000000000000000000000000000000000000',
    makerAddress: '0x0000000000000000000000000000000000000000',
    takerAddress: '0x0000000000000000000000000000000000000000',
    makerFee: new BigNumber(0),
    takerFee: new BigNumber(0),
    makerAssetAmount: new BigNumber(0),
    takerAssetAmount: new BigNumber(0),
    makerAssetData: '0x',
    takerAssetData: '0x',
    salt: new BigNumber(0),
    exchangeAddress: '0x0000000000000000000000000000000000000000',
    feeRecipientAddress: '0x0000000000000000000000000000000000000000',
    expirationTimeSeconds: new BigNumber(0),
};

const emptySignedOrder: SignedOrder = {
    ...emptyOrder,
    signature: '',
};

interface FillResults {
    makerAssetFilledAmount: BigNumber;
    takerAssetFilledAmount: BigNumber;
    makerFeePaid: BigNumber;
    takerFeePaid: BigNumber;
}

async function _getOverflowErrorForCall(): Promise<Error> {
    const errMsg = await getGanacheOrGethError('invalid opcode', 'Contract call failed');
    return new Error(errMsg);
}

async function _getOverflowErrorForSendTransaction(): Promise<Error> {
    const errMsg = await getGanacheOrGethError('invalid opcode', 'always failing transaction');
    return new Error(errMsg);
}

async function referenceGetPartialAmountAsync(
    numerator: BigNumber,
    denominator: BigNumber,
    target: BigNumber,
): Promise<BigNumber> {
    const overflowError = await _getOverflowErrorForCall();
    if (numerator.greaterThan(MAX_UINT256)) {
        throw overflowError;
    } else if (denominator.greaterThan(MAX_UINT256)) {
        throw overflowError;
    } else if (denominator.eq(new BigNumber(0))) {
        throw overflowError;
    } else if (target.greaterThan(MAX_UINT256)) {
        throw overflowError;
    }
    const product = numerator.mul(target);
    if (product.greaterThan(MAX_UINT256)) {
        throw overflowError;
    }
    return product.dividedToIntegerBy(denominator);
}

describe.only('Exchange core internal functions', () => {
    let testExchange: TestExchangeInternalsContract;
    let overflowErrorForCall: Error | undefined;
    let overflowErrorForSendTransaction: Error | undefined;

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
        overflowErrorForCall = await _getOverflowErrorForCall();
        overflowErrorForSendTransaction = await _getOverflowErrorForSendTransaction();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

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
            // They are only used with the corresponding feild from *the other*
            // FillResults, which are different.
            const totalFillResults = makeFillResults(totalValue);
            const singleFillResults = makeFillResults(singleValue);
            // Note(albrow): _.mergeWith mutates the first argument! To
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

    describe('isRoundingError', async () => {
        async function referenceIsRoundingErrorAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<boolean> {
            if (numerator.greaterThan(MAX_UINT256)) {
                throw overflowErrorForCall;
            } else if (denominator.greaterThan(MAX_UINT256)) {
                throw overflowErrorForCall;
            } else if (denominator.eq(new BigNumber(0))) {
                throw overflowErrorForCall;
            } else if (target.greaterThan(MAX_UINT256)) {
                throw overflowErrorForCall;
            }
            const product = numerator.mul(target);
            const remainder = product.mod(denominator);
            if (remainder.eq(new BigNumber(0))) {
                return false;
            }
            if (product.greaterThan(MAX_UINT256)) {
                throw overflowErrorForCall;
            }
            if (product.eq(new BigNumber(0))) {
                throw overflowErrorForCall;
            }
            const remainderTimes1000000 = remainder.mul(new BigNumber('1000000'));
            if (remainderTimes1000000.greaterThan(MAX_UINT256)) {
                throw overflowErrorForCall;
            }
            const errPercentageTimes1000000 = remainderTimes1000000.dividedToIntegerBy(product);
            return errPercentageTimes1000000.greaterThan(new BigNumber('1000'));
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
        async function referenceUpdateFilledStateAsync(
            takerAssetFilledAmount: BigNumber,
            orderTakerAssetFilledAmount: BigNumber,
            orderHash: string,
        ): Promise<BigNumber> {
            const totalFilledAmount = takerAssetFilledAmount.add(orderTakerAssetFilledAmount);
            if (totalFilledAmount.greaterThan(MAX_UINT256)) {
                throw overflowErrorForSendTransaction;
            }
            // TODO(albrow): Test orderHash overflowing bytes32?
            _.identity(orderHash);
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
                // TODO(albrow): Move emptySignedOrder and the zero address to a
                // utility library.
                await testExchange.publicUpdateFilledState.sendTransactionAsync(
                    emptySignedOrder,
                    '0x0000000000000000000000000000000000000000',
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
