import { orderFactory } from '@0xproject/order-utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { constants } from '../src/utils/constants';
import { marketOrdersOptimizationUtils } from '../src/utils/market_orders_optimization_utils';

import { chaiSetup } from './utils/chai_setup';
import { assert } from '../src/utils/assert';
import { NULL_BYTES } from '@0xproject/utils';

chaiSetup.configure();
const expect = chai.expect;

// utility for generating a set of order objects with mostly NULL values
// except for a specified makerAssetData and takerAssetData
const FAKE_ORDERS_COUNT = 5;
const generateFakeOrders = (makerAssetData: string, takerAssetData: string) =>
    _.map(_.range(FAKE_ORDERS_COUNT), index => {
        const order = orderFactory.createOrder(
            constants.NULL_ADDRESS,
            constants.NULL_ADDRESS,
            constants.NULL_ADDRESS,
            constants.ZERO_AMOUNT,
            constants.ZERO_AMOUNT,
            constants.ZERO_AMOUNT,
            makerAssetData,
            constants.ZERO_AMOUNT,
            takerAssetData,
            constants.NULL_ADDRESS,
            constants.NULL_ADDRESS,
        );
        return {
            ...order,
            signature: 'dummy signature',
        };
    });

describe('marketOrdersOptimizationUtils', () => {
    const fakeMakerAssetData = 'fakeMakerAssetData';
    const fakeTakerAssetData = 'fakeTakerAssetData';
    const orders = generateFakeOrders(fakeMakerAssetData, fakeTakerAssetData);
    describe('#optimizeMarketOrders', () => {
        it('should make makerAssetData `0x` unless first order', () => {
            const optimizedOrders = marketOrdersOptimizationUtils.optimizeMarketOrders(orders);
            expect(optimizedOrders[0].makerAssetData).to.equal(fakeMakerAssetData);
            const ordersWithoutHead = _.slice(optimizedOrders, 1);
            _.forEach(ordersWithoutHead, order => expect(order.makerAssetData).to.equal(constants.NULL_BYTES));
        });
        it('should make all takerAssetData `0x`', () => {
            const optimizedOrders = marketOrdersOptimizationUtils.optimizeMarketOrders(orders);
            _.forEach(optimizedOrders, order => expect(order.takerAssetData).to.equal(constants.NULL_BYTES));
        });
    });
    describe('#optimizeFeeOrders', () => {
        it('should make all makerAssetData `0x`', () => {
            const optimizedOrders = marketOrdersOptimizationUtils.optimizeFeeOrders(orders);
            _.forEach(optimizedOrders, order => expect(order.makerAssetData).to.equal(constants.NULL_BYTES));
        });
        it('should make all takerAssetData `0x`', () => {
            const optimizedOrders = marketOrdersOptimizationUtils.optimizeFeeOrders(orders);
            _.forEach(optimizedOrders, order => expect(order.takerAssetData).to.equal(constants.NULL_BYTES));
        });
    });
});
