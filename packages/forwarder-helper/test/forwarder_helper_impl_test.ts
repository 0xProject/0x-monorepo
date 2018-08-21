import { testOrderFactory } from '@0xproject/order-utils/lib/test/utils/test_order_factory';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { ForwarderHelperImpl, ForwarderHelperImplConfig } from '../src/forwarder_helper_impl';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('ForwarderHelperImpl', () => {
    // rate: 2 takerAsset / makerAsset
    const testOrder1 = testOrderFactory.generateTestSignedOrder({
        makerAssetAmount: new BigNumber(100),
        takerAssetAmount: new BigNumber(200),
    });
    // rate: 1 takerAsset / makerAsset
    const testOrder2 = testOrderFactory.generateTestSignedOrder({
        makerAssetAmount: new BigNumber(100),
        takerAssetAmount: new BigNumber(100),
    });
    // rate: 3 takerAsset / makerAsset
    const testOrder3 = testOrderFactory.generateTestSignedOrder({
        makerAssetAmount: new BigNumber(100),
        takerAssetAmount: new BigNumber(300),
    });
    // rate: 3 WETH / ZRX
    const testFeeOrder1 = testOrderFactory.generateTestSignedOrder({
        makerAssetAmount: new BigNumber(100),
        takerAssetAmount: new BigNumber(300),
    });
    // rate: 2 WETH / ZRX
    const testFeeOrder2 = testOrderFactory.generateTestSignedOrder({
        makerAssetAmount: new BigNumber(100),
        takerAssetAmount: new BigNumber(200),
    });
    // rate: 1 WETH / ZRX
    const testFeeOrder3 = testOrderFactory.generateTestSignedOrder({
        makerAssetAmount: new BigNumber(100),
        takerAssetAmount: new BigNumber(100),
    });
    describe('#constructor', () => {
        const inputForwarderHelperConfig: ForwarderHelperImplConfig = {
            orders: [testOrder1, testOrder2, testOrder3],
            feeOrders: [testFeeOrder1, testFeeOrder2, testFeeOrder3],
            remainingFillableMakerAssetAmounts: [new BigNumber(1), new BigNumber(2), new BigNumber(3)],
            remainingFillableFeeAmounts: [new BigNumber(4), new BigNumber(5), new BigNumber(6)],
        };
        const inputForwarderHelperConfigNoRemainingAmounts: ForwarderHelperImplConfig = {
            orders: [testOrder1, testOrder2, testOrder3],
            feeOrders: [testFeeOrder1, testFeeOrder2, testFeeOrder3],
        };
        it('sorts orders', () => {
            const forwarderHelper = new ForwarderHelperImpl(inputForwarderHelperConfig);
            expect(forwarderHelper.config.orders).deep.equals([testOrder2, testOrder1, testOrder3]);
        });
        it('sorts fee orders', () => {
            const forwarderHelper = new ForwarderHelperImpl(inputForwarderHelperConfig);
            expect(forwarderHelper.config.feeOrders).deep.equals([testFeeOrder3, testFeeOrder2, testFeeOrder1]);
        });
        it('sorts remainingFillableMakerAssetAmounts', () => {
            const forwarderHelper = new ForwarderHelperImpl(inputForwarderHelperConfig);
            expect(forwarderHelper.config.remainingFillableMakerAssetAmounts).to.be.not.undefined();
            expect(_.nth(forwarderHelper.config.remainingFillableMakerAssetAmounts, 0)).to.bignumber.equal(
                new BigNumber(2),
            );
            expect(_.nth(forwarderHelper.config.remainingFillableMakerAssetAmounts, 1)).to.bignumber.equal(
                new BigNumber(1),
            );
            expect(_.nth(forwarderHelper.config.remainingFillableMakerAssetAmounts, 2)).to.bignumber.equal(
                new BigNumber(3),
            );
        });
        it('sorts remainingFillableFeeAmounts', () => {
            const forwarderHelper = new ForwarderHelperImpl(inputForwarderHelperConfig);
            expect(forwarderHelper.config.remainingFillableFeeAmounts).to.be.not.undefined();
            expect(_.nth(forwarderHelper.config.remainingFillableFeeAmounts, 0)).to.bignumber.equal(new BigNumber(6));
            expect(_.nth(forwarderHelper.config.remainingFillableFeeAmounts, 1)).to.bignumber.equal(new BigNumber(5));
            expect(_.nth(forwarderHelper.config.remainingFillableFeeAmounts, 2)).to.bignumber.equal(new BigNumber(4));
        });
        it('remainingFillableMakerAssetAmounts is undefined if none provided', () => {
            const forwarderHelper = new ForwarderHelperImpl(inputForwarderHelperConfigNoRemainingAmounts);
            expect(forwarderHelper.config.remainingFillableMakerAssetAmounts).to.be.undefined();
        });
        it('remainingFillableFeeAmounts is undefined if none provided', () => {
            const forwarderHelper = new ForwarderHelperImpl(inputForwarderHelperConfigNoRemainingAmounts);
            expect(forwarderHelper.config.remainingFillableFeeAmounts).to.be.undefined();
        });
    });
    // describe('#getMarketBuyOrdersInfo', () => {});
    // describe('#getMarketSellOrdersInfo', () => {});
});
