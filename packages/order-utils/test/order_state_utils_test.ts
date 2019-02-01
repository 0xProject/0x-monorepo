import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { AbstractBalanceAndProxyAllowanceFetcher } from '../src/abstract/abstract_balance_and_proxy_allowance_fetcher';
import { AbstractOrderFilledCancelledFetcher } from '../src/abstract/abstract_order_filled_cancelled_fetcher';
import { OrderStateUtils } from '../src/order_state_utils';

import { chaiSetup } from './utils/chai_setup';
import { testOrderFactory } from './utils/test_order_factory';

chaiSetup.configure();
const expect = chai.expect;

describe('OrderStateUtils', () => {
    describe('#getOpenOrderStateAsync', () => {
        const buildMockBalanceFetcher = (takerBalance: BigNumber): AbstractBalanceAndProxyAllowanceFetcher => {
            const balanceFetcher = {
                async getBalanceAsync(_assetData: string, _userAddress: string): Promise<BigNumber> {
                    return takerBalance;
                },
                async getProxyAllowanceAsync(_assetData: string, _userAddress: string): Promise<BigNumber> {
                    return takerBalance;
                },
            };
            return balanceFetcher;
        };
        const buildMockOrderFilledFetcher = (
            filledAmount: BigNumber = new BigNumber(0),
            cancelled: boolean = false,
        ): AbstractOrderFilledCancelledFetcher => {
            const orderFetcher = {
                async getFilledTakerAmountAsync(_orderHash: string): Promise<BigNumber> {
                    return filledAmount;
                },
                async isOrderCancelledAsync(_orderHash: string): Promise<boolean> {
                    return cancelled;
                },
                getZRXAssetData(): string {
                    return '';
                },
            };
            return orderFetcher;
        };
        it('should have valid order state if order can be fully filled with small maker amount', async () => {
            const makerAssetAmount = new BigNumber(10);
            const takerAssetAmount = new BigNumber(10000000000000000);
            const takerBalance = takerAssetAmount;
            const orderFilledAmount = new BigNumber(0);
            const mockBalanceFetcher = buildMockBalanceFetcher(takerBalance);
            const mockOrderFilledFetcher = buildMockOrderFilledFetcher(orderFilledAmount);
            const [signedOrder] = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                    takerAssetAmount,
                },
                1,
            );

            const orderStateUtils = new OrderStateUtils(mockBalanceFetcher, mockOrderFilledFetcher);
            const orderState = await orderStateUtils.getOpenOrderStateAsync(signedOrder);
            expect(orderState.isValid).to.eq(true);
        });
        it('should be invalid when an order is partially filled where only a rounding error remains', async () => {
            const makerAssetAmount = new BigNumber(1001);
            const takerAssetAmount = new BigNumber(3);
            const takerBalance = takerAssetAmount;
            const orderFilledAmount = new BigNumber(2);
            const mockBalanceFetcher = buildMockBalanceFetcher(takerBalance);
            const mockOrderFilledFetcher = buildMockOrderFilledFetcher(orderFilledAmount);
            const [signedOrder] = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                    takerAssetAmount,
                },
                1,
            );

            const orderStateUtils = new OrderStateUtils(mockBalanceFetcher, mockOrderFilledFetcher);
            const orderState = await orderStateUtils.getOpenOrderStateAsync(signedOrder);
            expect(orderState.isValid).to.eq(false);
        });
        it('should be invalid when an order is cancelled', async () => {
            const makerAssetAmount = new BigNumber(1000);
            const takerAssetAmount = new BigNumber(2);
            const takerBalance = takerAssetAmount;
            const orderFilledAmount = new BigNumber(0);
            const isCancelled = true;
            const mockBalanceFetcher = buildMockBalanceFetcher(takerBalance);
            const mockOrderFilledFetcher = buildMockOrderFilledFetcher(orderFilledAmount, isCancelled);
            const [signedOrder] = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                    takerAssetAmount,
                },
                1,
            );

            const orderStateUtils = new OrderStateUtils(mockBalanceFetcher, mockOrderFilledFetcher);
            const orderState = await orderStateUtils.getOpenOrderStateAsync(signedOrder);
            expect(orderState.isValid).to.eq(false);
        });
        it('should be invalid when an order is fully filled', async () => {
            const makerAssetAmount = new BigNumber(1000);
            const takerAssetAmount = new BigNumber(2);
            const takerBalance = takerAssetAmount;
            const orderFilledAmount = takerAssetAmount;
            const isCancelled = false;
            const mockBalanceFetcher = buildMockBalanceFetcher(takerBalance);
            const mockOrderFilledFetcher = buildMockOrderFilledFetcher(orderFilledAmount, isCancelled);
            const [signedOrder] = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                    takerAssetAmount,
                },
                1,
            );

            const orderStateUtils = new OrderStateUtils(mockBalanceFetcher, mockOrderFilledFetcher);
            const orderState = await orderStateUtils.getOpenOrderStateAsync(signedOrder);
            expect(orderState.isValid).to.eq(false);
        });
        it('should include the transactionHash in orderState if supplied in method invocation', async () => {
            const makerAssetAmount = new BigNumber(10);
            const takerAssetAmount = new BigNumber(10000000000000000);
            const takerBalance = takerAssetAmount;
            const orderFilledAmount = new BigNumber(0);
            const mockBalanceFetcher = buildMockBalanceFetcher(takerBalance);
            const mockOrderFilledFetcher = buildMockOrderFilledFetcher(orderFilledAmount);
            const [signedOrder] = testOrderFactory.generateTestSignedOrders(
                {
                    makerAssetAmount,
                    takerAssetAmount,
                },
                1,
            );

            const orderStateUtils = new OrderStateUtils(mockBalanceFetcher, mockOrderFilledFetcher);
            const transactionHash = '0xdeadbeef';
            const orderState = await orderStateUtils.getOpenOrderStateAsync(signedOrder, transactionHash);
            expect(orderState.transactionHash).to.eq(transactionHash);
        });
    });
});
