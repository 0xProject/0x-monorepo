import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber, logUtils } from '@0xproject/utils';
import * as chai from 'chai';
import * as combinatorics from 'js-combinatorics';
import * as _ from 'lodash';

import { TestMixinExchangeCoreContract } from '../../generated_contract_wrappers/test_mixin_exchange_core';
import { artifacts } from '../utils/artifacts';
import { chaiSetup } from '../utils/chai_setup';
import { bytes32Values, uint256Values } from '../utils/combinatorial_sets';
import { constants } from '../utils/constants';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

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

describe.only('Exchange core internal', () => {
    let testExchange: TestMixinExchangeCoreContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        testExchange = await TestMixinExchangeCoreContract.deployFrom0xArtifactAsync(
            artifacts.TestMixinExchangeCore,
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

    describe.only('updateFilledState', async () => {
        function referenceUpdateFilledState(
            takerAssetFilledAmount: BigNumber,
            orderTakerAssetFilledAmount: BigNumber,
            orderHash: string,
        ): void {
            if (
                takerAssetFilledAmount.add(orderTakerAssetFilledAmount).greaterThan(new BigNumber(2).pow(256).minus(1))
            ) {
                throw new Error('invalid opcode');
            }
            // TODO(albrow): Test orderHash overflowing bytes32.
            _.identity(orderHash);
        }
        async function testUpdateFilledStateAsync(
            takerAssetFilledAmount: BigNumber,
            orderTakerAssetFilledAmount: BigNumber,
            orderHash: string,
        ): Promise<void> {
            const fillResults = {
                makerAssetFilledAmount: new BigNumber(0),
                takerAssetFilledAmount,
                makerFeePaid: new BigNumber(0),
                takerFeePaid: new BigNumber(0),
            };
            web3Wrapper.awaitTransactionSuccessAsync(
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
        }
        const testCases = combinatorics.cartesianProduct(uint256Values, uint256Values, bytes32Values);
        logUtils.warn(`Generated ${testCases.length} combinatorial test cases.`);
        let counter = -1;
        testCases.forEach(async testCase => {
            counter += 1;
            const testCaseString = JSON.stringify(testCase);
            it(`updateFilledState test case ${counter}`, async () => {
                let expectedErr: string | undefined;
                try {
                    referenceUpdateFilledState(testCase[0], testCase[1], testCase[2]);
                } catch (e) {
                    expectedErr = e.message;
                }
                try {
                    await testUpdateFilledStateAsync(testCase[0], testCase[1], testCase[2]);
                } catch (e) {
                    if (_.isUndefined(expectedErr)) {
                        throw new Error(`Unexpected error:  ${e.message}\n\tTest case: ${testCaseString}`);
                    } else {
                        expect(e.message).to.contain(expectedErr, `${e.message}\n\tTest case: ${testCaseString}`);
                    }
                }
            });
        });
    });
});
