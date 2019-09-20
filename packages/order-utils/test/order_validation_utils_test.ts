import { ContractAddresses, DummyERC20TokenContract } from '@0x/abi-gen-wrappers';
import { NetworkId } from '@0x/contract-addresses';
import { BlockchainLifecycle, devConstants, tokenUtils } from '@0x/dev-utils';
import { runMigrationsOnceAsync } from '@0x/migrations';
import { ExchangeContractErrs, RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { AbstractOrderFilledCancelledFetcher, assetDataUtils, signatureUtils, SignedOrder } from '../src';
import { OrderValidationUtils } from '../src/order_validation_utils';

import { UntransferrableDummyERC20Token } from './artifacts/UntransferrableDummyERC20Token';
import { chaiSetup } from './utils/chai_setup';
import { testOrderFactory } from './utils/test_order_factory';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('OrderValidationUtils', () => {
    describe('#isRoundingError', () => {
        it('should return false if there is a rounding error of 0.1%', async () => {
            const numerator = new BigNumber(20);
            const denominator = new BigNumber(999);
            const target = new BigNumber(50);
            // rounding error = ((20*50/999) - floor(20*50/999)) / (20*50/999) = 0.1%
            const isRoundingError = OrderValidationUtils.isRoundingErrorFloor(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });

        it('should return false if there is a rounding of 0.09%', async () => {
            const numerator = new BigNumber(20);
            const denominator = new BigNumber(9991);
            const target = new BigNumber(500);
            // rounding error = ((20*500/9991) - floor(20*500/9991)) / (20*500/9991) = 0.09%
            const isRoundingError = OrderValidationUtils.isRoundingErrorFloor(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });

        it('should return true if there is a rounding error of 0.11%', async () => {
            const numerator = new BigNumber(20);
            const denominator = new BigNumber(9989);
            const target = new BigNumber(500);
            // rounding error = ((20*500/9989) - floor(20*500/9989)) / (20*500/9989) = 0.011%
            const isRoundingError = OrderValidationUtils.isRoundingErrorFloor(numerator, denominator, target);
            expect(isRoundingError).to.be.true();
        });

        it('should return true if there is a rounding error > 0.1%', async () => {
            const numerator = new BigNumber(3);
            const denominator = new BigNumber(7);
            const target = new BigNumber(10);
            // rounding error = ((3*10/7) - floor(3*10/7)) / (3*10/7) = 6.67%
            const isRoundingError = OrderValidationUtils.isRoundingErrorFloor(numerator, denominator, target);
            expect(isRoundingError).to.be.true();
        });

        it('should return false when there is no rounding error', async () => {
            const numerator = new BigNumber(1);
            const denominator = new BigNumber(2);
            const target = new BigNumber(10);

            const isRoundingError = OrderValidationUtils.isRoundingErrorFloor(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });

        it('should return false when there is rounding error <= 0.1%', async () => {
            // randomly generated numbers
            const numerator = new BigNumber(76564);
            const denominator = new BigNumber(676373677);
            const target = new BigNumber(105762562);
            // rounding error = ((76564*105762562/676373677) - floor(76564*105762562/676373677)) /
            // (76564*105762562/676373677) = 0.0007%
            const isRoundingError = OrderValidationUtils.isRoundingErrorFloor(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });
    });
    describe('#validateOrderFillableOrThrowAsync', () => {
        let contractAddresses: ContractAddresses;
        let orderValidationUtils: OrderValidationUtils;
        let makerAddress: string;
        let takerAddress: string;
        let ownerAddress: string;
        let signedOrder: SignedOrder;
        let makerTokenContract: DummyERC20TokenContract;
        let takerTokenContract: DummyERC20TokenContract;
        let networkId: NetworkId;
        const txDefaults = {
            gas: devConstants.GAS_LIMIT,
            from: devConstants.TESTRPC_FIRST_ADDRESS,
        };
        before(async () => {
            contractAddresses = await runMigrationsOnceAsync(provider, txDefaults);
            await blockchainLifecycle.startAsync();

            const [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
            makerTokenContract = new DummyERC20TokenContract(makerTokenAddress, provider, txDefaults);
            takerTokenContract = new DummyERC20TokenContract(takerTokenAddress, provider, txDefaults);
            [ownerAddress, makerAddress, takerAddress] = await web3Wrapper.getAvailableAddressesAsync();
            networkId = await web3Wrapper.getNetworkIdAsync();

            // create signed order
            const [makerAssetData, takerAssetData] = [
                assetDataUtils.encodeERC20AssetData(makerTokenContract.address),
                assetDataUtils.encodeERC20AssetData(takerTokenContract.address),
            ];
            const defaultOrderParams = {
                makerAddress,
                takerAddress,
                makerAssetData,
                takerAssetData,
            };
            const makerAssetAmount = new BigNumber(10);
            const takerAssetAmount = new BigNumber(10000000000000000);
            const [order] = testOrderFactory.generateTestSignedOrders(
                {
                    ...defaultOrderParams,
                    makerAssetAmount,
                    takerAssetAmount,
                },
                1,
            );
            signedOrder = await signatureUtils.ecSignOrderAsync(provider, order, makerAddress);

            // instantiate OrderValidationUtils
            const mockOrderFilledFetcher: AbstractOrderFilledCancelledFetcher = {
                async getFilledTakerAmountAsync(_orderHash: string): Promise<BigNumber> {
                    return new BigNumber(0);
                },
                async isOrderCancelledAsync(_signedOrder: SignedOrder): Promise<boolean> {
                    return false;
                },
            };
            orderValidationUtils = new OrderValidationUtils(mockOrderFilledFetcher, provider);
        });
        after(async () => {
            await blockchainLifecycle.revertAsync();
        });
        beforeEach(async () => {
            await blockchainLifecycle.startAsync();
            await makerTokenContract.setBalance.awaitTransactionSuccessAsync(
                makerAddress,
                signedOrder.makerAssetAmount,
            );
            await takerTokenContract.setBalance.awaitTransactionSuccessAsync(
                takerAddress,
                signedOrder.takerAssetAmount,
            );
            await makerTokenContract.approve.awaitTransactionSuccessAsync(
                contractAddresses.erc20Proxy,
                signedOrder.makerAssetAmount,
                { from: makerAddress },
            );
            await takerTokenContract.approve.awaitTransactionSuccessAsync(
                contractAddresses.erc20Proxy,
                signedOrder.takerAssetAmount,
                { from: takerAddress },
            );
        });
        afterEach(async () => {
            await blockchainLifecycle.revertAsync();
        });
        it('should throw if signature is invalid', async () => {
            const signedOrderWithInvalidSignature = {
                ...signedOrder,
                signature:
                    '0x1b61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace225403',
            };

            return expect(
                orderValidationUtils.simpleValidateOrderFillableOrThrowAsync(
                    networkId,
                    provider,
                    signedOrderWithInvalidSignature,
                ),
            ).to.be.rejectedWith(RevertReason.InvalidOrderSignature);
        });
        it('should validate the order with the current balances and allowances for the maker', async () => {
            await orderValidationUtils.simpleValidateOrderFillableOrThrowAsync(networkId, provider, signedOrder, {
                validateRemainingOrderAmountIsFillable: false,
            });
        });
        it('should validate the order with remaining fillable amount for the order', async () => {
            await orderValidationUtils.simpleValidateOrderFillableOrThrowAsync(networkId, provider, signedOrder);
        });
        it('should validate the order with specified amount', async () => {
            await orderValidationUtils.simpleValidateOrderFillableOrThrowAsync(networkId, provider, signedOrder, {
                expectedFillTakerTokenAmount: signedOrder.takerAssetAmount,
            });
        });
        it('should throw if the amount is greater than the allowance/balance', async () => {
            return expect(
                orderValidationUtils.simpleValidateOrderFillableOrThrowAsync(networkId, provider, signedOrder, {
                    // tslint:disable-next-line:custom-no-magic-numbers
                    expectedFillTakerTokenAmount: new BigNumber(2).pow(256).minus(1),
                }),
            ).to.be.rejectedWith(ExchangeContractErrs.InsufficientMakerAllowance);
        });
        it('should throw when the maker does not have enough balance for the remaining order amount', async () => {
            await makerTokenContract.setBalance.awaitTransactionSuccessAsync(
                makerAddress,
                signedOrder.makerAssetAmount.minus(1),
            );
            return expect(
                orderValidationUtils.simpleValidateOrderFillableOrThrowAsync(networkId, provider, signedOrder),
            ).to.be.rejectedWith(ExchangeContractErrs.InsufficientMakerBalance);
        });
        it('should validate the order when remaining order amount has some fillable amount', async () => {
            await makerTokenContract.setBalance.awaitTransactionSuccessAsync(
                makerAddress,
                signedOrder.makerAssetAmount.minus(1),
            );
            await orderValidationUtils.simpleValidateOrderFillableOrThrowAsync(networkId, provider, signedOrder, {
                validateRemainingOrderAmountIsFillable: false,
            });
        });
        it('should throw when the ERC20 token has transfer restrictions', async () => {
            const artifactDependencies = {};
            const untransferrableToken = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
                UntransferrableDummyERC20Token,
                provider,
                { from: ownerAddress },
                artifactDependencies,
                'UntransferrableToken',
                'UTT',
                new BigNumber(18),
                // tslint:disable-next-line:custom-no-magic-numbers
                new BigNumber(2).pow(20).minus(1),
            );
            const untransferrableMakerAssetData = assetDataUtils.encodeERC20AssetData(untransferrableToken.address);
            const invalidOrder = {
                ...signedOrder,
                makerAssetData: untransferrableMakerAssetData,
            };
            const invalidSignedOrder = await signatureUtils.ecSignOrderAsync(provider, invalidOrder, makerAddress);
            await untransferrableToken.setBalance.awaitTransactionSuccessAsync(
                makerAddress,
                invalidSignedOrder.makerAssetAmount.plus(1),
            );
            await untransferrableToken.approve.awaitTransactionSuccessAsync(
                contractAddresses.erc20Proxy,
                invalidSignedOrder.makerAssetAmount.plus(1),
                { from: makerAddress },
            );
            return expect(
                orderValidationUtils.simpleValidateOrderFillableOrThrowAsync(networkId, provider, invalidSignedOrder),
            ).to.be.rejectedWith(RevertReason.TransferFailed);
        });
    });
});
