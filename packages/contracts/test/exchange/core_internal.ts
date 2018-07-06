import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber, logUtils } from '@0xproject/utils';
import * as chai from 'chai';
import * as combinatorics from 'js-combinatorics';
import * as _ from 'lodash';

import { TestExchangeInternalsContract } from '../../generated_contract_wrappers/test_exchange_internals';
import { artifacts } from '../utils/artifacts';
import { chaiSetup } from '../utils/chai_setup';
import { bytes32Values, uint256Values, testCombinatoriallyWithReferenceFuncAsync } from '../utils/combinatorial_sets';
import { constants } from '../utils/constants';
import { testWithReferenceFuncAsync } from '../utils/test_with_reference';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);

const emptySignedOrder: SignedOrder = {
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
    signature: '',
};

interface FillResults {
    makerAssetFilledAmount: BigNumber;
    takerAssetFilledAmount: BigNumber;
    makerFeePaid: BigNumber;
    takerFeePaid: BigNumber;
}

describe.only('Exchange core internal functions', () => {
    let testExchange: TestExchangeInternalsContract;

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
                        throw new Error('invalid opcode');
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

    describe('getPartialAmount', async () => {
        async function referenceGetPartialAmountAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
        ): Promise<BigNumber> {
            if (numerator.greaterThan(MAX_UINT256)) {
                throw new Error('invalid opcode');
            } else if (denominator.greaterThan(MAX_UINT256)) {
                throw new Error('invalid opcode');
            } else if (denominator.eq(new BigNumber(0))) {
                throw new Error('invalid opcode');
            } else if (target.greaterThan(MAX_UINT256)) {
                throw new Error('invalid opcode');
            }
            const product = numerator.mul(target);
            if (product.greaterThan(MAX_UINT256)) {
                throw new Error('invalid opcode');
            }
            return product.dividedToIntegerBy(denominator);
        }
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

    describe('updateFilledState', async () => {
        async function referenceUpdateFilledStateAsync(
            takerAssetFilledAmount: BigNumber,
            orderTakerAssetFilledAmount: BigNumber,
            orderHash: string,
        ): Promise<BigNumber> {
            const totalFilledAmount = takerAssetFilledAmount.add(orderTakerAssetFilledAmount);
            if (totalFilledAmount.greaterThan(MAX_UINT256)) {
                throw new Error('invalid opcode');
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
