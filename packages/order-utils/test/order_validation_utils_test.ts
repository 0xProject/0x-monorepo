import { Order, RevertReason, SignedOrder } from '@0xproject/types';
import { BigNumber, NULL_BYTES } from '@0xproject/utils';
import * as chai from 'chai';
import 'mocha';

import { ExchangeTransferSimulator } from '../src/exchange_transfer_simulator';
import { orderHashUtils } from '../src/order_hash';
import { OrderValidationUtils } from '../src/order_validation_utils';
import { signatureUtils } from '../src/signature_utils';
import { BalanceAndProxyAllowanceLazyStore } from '../src/store/balance_and_proxy_allowance_lazy_store';

import { chaiSetup } from './utils/chai_setup';
import { buildMockBalanceFetcher, buildMockOrderFilledFetcher } from './utils/mock_fetchers';
import { testOrderFactory } from './utils/test_order_factory';
import { provider } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

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
        const takerAssetAmount = new BigNumber('1000');
        const makerAssetAmount = new BigNumber('1000');
        const makerAddress = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
        const signOrderAsync = async (order: Order): Promise<SignedOrder> => {
            const orderHash = orderHashUtils.getOrderHashHex(order);
            const signature = await signatureUtils.ecSignHashAsync(provider, orderHash, makerAddress);
            return { ...order, signature };
        };
        it('should succeed if an order is valid and fillable', async () => {
            const takerFilledAmount = new BigNumber(0);
            const isCancelled = false;
            const balanceAllowanceFetcher = buildMockBalanceFetcher(takerAssetAmount);
            const filledCancelledFetcher = buildMockOrderFilledFetcher(takerFilledAmount, isCancelled);
            const balanceAndProxyAllowanceLazyStore = new BalanceAndProxyAllowanceLazyStore(balanceAllowanceFetcher);
            const exchangeTransferSimulator = new ExchangeTransferSimulator(balanceAndProxyAllowanceLazyStore);
            const orderValidationUtils = new OrderValidationUtils(filledCancelledFetcher);
            const [order] = testOrderFactory.generateTestSignedOrders(
                {
                    makerAddress,
                    makerAssetAmount,
                    takerAssetAmount,
                },
                1,
            );
            const signedOrder = await signOrderAsync(order);

            await orderValidationUtils.validateOrderFillableOrThrowAsync(
                exchangeTransferSimulator,
                provider,
                signedOrder,
                NULL_BYTES,
            );
        });
        it('should throw if an order is cancelled', async () => {
            const takerFilledAmount = new BigNumber(0);
            const isCancelled = true;
            const balanceAllowanceFetcher = buildMockBalanceFetcher(takerAssetAmount);
            const filledCancelledFetcher = buildMockOrderFilledFetcher(takerFilledAmount, isCancelled);
            const balanceAndProxyAllowanceLazyStore = new BalanceAndProxyAllowanceLazyStore(balanceAllowanceFetcher);
            const exchangeTransferSimulator = new ExchangeTransferSimulator(balanceAndProxyAllowanceLazyStore);
            const orderValidationUtils = new OrderValidationUtils(filledCancelledFetcher);
            const [order] = testOrderFactory.generateTestSignedOrders(
                {
                    makerAddress,
                    makerAssetAmount,
                    takerAssetAmount,
                },
                1,
            );
            const signedOrder = await signOrderAsync(order);

            expect(
                orderValidationUtils.validateOrderFillableOrThrowAsync(
                    exchangeTransferSimulator,
                    provider,
                    signedOrder,
                    NULL_BYTES,
                ),
            ).to.be.rejectedWith(RevertReason.OrderCancelled);
        });
        it('should throw if an order is fully filled', async () => {
            const isCancelled = false;
            const balanceAllowanceFetcher = buildMockBalanceFetcher(takerAssetAmount);
            const filledCancelledFetcher = buildMockOrderFilledFetcher(takerAssetAmount, isCancelled);
            const balanceAndProxyAllowanceLazyStore = new BalanceAndProxyAllowanceLazyStore(balanceAllowanceFetcher);
            const exchangeTransferSimulator = new ExchangeTransferSimulator(balanceAndProxyAllowanceLazyStore);
            const orderValidationUtils = new OrderValidationUtils(filledCancelledFetcher);
            const [order] = testOrderFactory.generateTestSignedOrders(
                {
                    makerAddress,
                    makerAssetAmount,
                    takerAssetAmount,
                },
                1,
            );
            const signedOrder = await signOrderAsync(order);

            expect(
                orderValidationUtils.validateOrderFillableOrThrowAsync(
                    exchangeTransferSimulator,
                    provider,
                    signedOrder,
                    NULL_BYTES,
                ),
            ).to.be.rejectedWith(RevertReason.OrderUnfillable);
        });
        it('should throw if an order maker amount is 0', async () => {
            const isCancelled = false;
            const balanceAllowanceFetcher = buildMockBalanceFetcher(takerAssetAmount);
            const filledCancelledFetcher = buildMockOrderFilledFetcher(takerAssetAmount, isCancelled);
            const balanceAndProxyAllowanceLazyStore = new BalanceAndProxyAllowanceLazyStore(balanceAllowanceFetcher);
            const exchangeTransferSimulator = new ExchangeTransferSimulator(balanceAndProxyAllowanceLazyStore);
            const orderValidationUtils = new OrderValidationUtils(filledCancelledFetcher);
            const [order] = testOrderFactory.generateTestSignedOrders(
                {
                    makerAddress,
                    makerAssetAmount: new BigNumber(0),
                    takerAssetAmount,
                },
                1,
            );
            const signedOrder = await signOrderAsync(order);

            expect(
                orderValidationUtils.validateOrderFillableOrThrowAsync(
                    exchangeTransferSimulator,
                    provider,
                    signedOrder,
                    NULL_BYTES,
                ),
            ).to.be.rejectedWith(RevertReason.OrderUnfillable);
        });
        it('should throw if an order signature is invalid', async () => {
            const isCancelled = false;
            const balanceAllowanceFetcher = buildMockBalanceFetcher(takerAssetAmount);
            const filledCancelledFetcher = buildMockOrderFilledFetcher(takerAssetAmount, isCancelled);
            const balanceAndProxyAllowanceLazyStore = new BalanceAndProxyAllowanceLazyStore(balanceAllowanceFetcher);
            const exchangeTransferSimulator = new ExchangeTransferSimulator(balanceAndProxyAllowanceLazyStore);
            const orderValidationUtils = new OrderValidationUtils(filledCancelledFetcher);
            const [order] = testOrderFactory.generateTestSignedOrders(
                {
                    makerAddress,
                    makerAssetAmount,
                    takerAssetAmount,
                },
                1,
            );
            expect(
                orderValidationUtils.validateOrderFillableOrThrowAsync(
                    exchangeTransferSimulator,
                    provider,
                    order,
                    NULL_BYTES,
                ),
            ).to.be.rejectedWith(RevertReason.InvalidSignature);
        });
    });
});
