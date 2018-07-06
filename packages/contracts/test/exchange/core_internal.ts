import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber, logUtils } from '@0xproject/utils';
import * as chai from 'chai';
import * as combinatorics from 'js-combinatorics';
import * as _ from 'lodash';

import { TestExchangeInternalsContract } from '../../generated_contract_wrappers/test_exchange_internals';
import { artifacts } from '../utils/artifacts';
import { chaiSetup } from '../utils/chai_setup';
import { bytes32Values, uint256Values } from '../utils/combinatorial_sets';
import { constants } from '../utils/constants';
import { testWithReferenceFuncAsync } from '../utils/reference_test';
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
        async function referenceAddFillResultsAsync(
            totalFillResults: FillResults,
            singlFillResults: FillResults,
        ): Promise<FillResults> {
            // Note(albrow): _.mergeWith mutates the first argument! To
            // workaround this we use _.cloneDeep.
            return _.mergeWith(
                _.cloneDeep(totalFillResults),
                singlFillResults,
                (totalVal: BigNumber, singleVal: BigNumber) => {
                    const newTotal = totalVal.add(singleVal);
                    if (newTotal.greaterThan(MAX_UINT256)) {
                        throw new Error('invalid opcode');
                    }
                    return newTotal;
                },
            );
        }
        async function testAddFillResultsAsync(
            totalFillResults: FillResults,
            singleFillResults: FillResults,
        ): Promise<FillResults> {
            return testExchange.publicAddFillResults.callAsync(totalFillResults, singleFillResults);
        }
        const testCases = combinatorics.cartesianProduct(uint256Values, uint256Values);
        logUtils.warn(`Generated ${testCases.length} combinatorial test cases.`);
        let counter = -1;
        testCases.forEach(async testCase => {
            counter += 1;
            it(`addFillResults test case ${counter}`, async () => {
                const totalFillResults = {
                    makerAssetFilledAmount: testCase[0],
                    takerAssetFilledAmount: testCase[0],
                    makerFeePaid: testCase[0],
                    takerFeePaid: testCase[0],
                };
                const singleFillResults = {
                    makerAssetFilledAmount: testCase[1],
                    takerAssetFilledAmount: testCase[1],
                    makerFeePaid: testCase[1],
                    takerFeePaid: testCase[1],
                };
                await testWithReferenceFuncAsync(referenceAddFillResultsAsync, testAddFillResultsAsync, [
                    totalFillResults,
                    singleFillResults,
                ]);
            });
        });
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
        const testCases = combinatorics.cartesianProduct(uint256Values, uint256Values, uint256Values);
        logUtils.warn(`Generated ${testCases.length} combinatorial test cases.`);
        let counter = -1;
        testCases.forEach(async testCase => {
            counter += 1;
            it(`GetPartialAmount test case ${counter}`, async () => {
                await testWithReferenceFuncAsync(referenceGetPartialAmountAsync, testGetPartialAmountAsync, testCase);
            });
        });
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
        const testCases = combinatorics.cartesianProduct(uint256Values, uint256Values, bytes32Values);
        logUtils.warn(`Generated ${testCases.length} combinatorial test cases.`);
        let counter = -1;
        testCases.forEach(async testCase => {
            counter += 1;
            const testCaseString = JSON.stringify(testCase);
            it(`updateFilledState test case ${counter}`, async () => {
                await testWithReferenceFuncAsync(referenceUpdateFilledStateAsync, testUpdateFilledStateAsync, testCase);
            });
        });
    });
});
