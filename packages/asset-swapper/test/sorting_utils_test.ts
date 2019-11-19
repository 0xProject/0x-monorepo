import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { sortingUtils } from '../src/utils/sorting_utils';

import { chaiSetup } from './utils/chai_setup';
import { testOrderFactory } from './utils/test_order_factory';

chaiSetup.configure();
const expect = chai.expect;

const FAKE_ERC20_TAKER_ASSET_DATA = '0xf47261b22222222222222222222222222222222222222222222222222222222222222222';
const FAKE_ERC20_MAKER_ASSET_DATA = '0xf47261b11111111111111111111111111111111111111111111111111111111111111111';

describe('sortingUtils', () => {
    describe('#sortOrders', () => {
        // rate: 2 takerAsset / makerAsset
        const testOrder1 = testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new BigNumber(100),
            takerAssetAmount: new BigNumber(200),
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 1 takerAsset / makerAsset
        const testOrder2 = testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new BigNumber(100),
            takerAssetAmount: new BigNumber(100),
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 2.5 takerAsset / makerAsset
        const testOrder3 = testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new BigNumber(100),
            takerAssetAmount: new BigNumber(250),
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 2 takerAsset / makerAsset
        const testOrderWithFeeInTakerAsset1 = testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new BigNumber(100),
            takerAssetAmount: new BigNumber(100),
            takerFee: new BigNumber(100),
            takerFeeAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 1 takerAsset / makerAsset
        const testOrderWithFeeInTakerAsset2 = testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new BigNumber(100),
            takerAssetAmount: new BigNumber(50),
            takerFee: new BigNumber(50),
            takerFeeAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 2.5 takerAsset / makerAsset
        const testOrderWithFeeInTakerAsset3 = testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new BigNumber(100),
            takerAssetAmount: new BigNumber(200),
            takerFee: new BigNumber(50),
            takerFeeAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 2 takerAsset / makerAsset
        const testOrderWithFeeInMakerAsset1 = testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new BigNumber(200),
            takerAssetAmount: new BigNumber(200),
            takerFee: new BigNumber(100),
            takerFeeAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 1 takerAsset / makerAsset
        const testOrderWithFeeInMakerAsset2 = testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new BigNumber(150),
            takerAssetAmount: new BigNumber(100),
            takerFee: new BigNumber(50),
            takerFeeAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        // rate: 2.5 takerAsset / makerAsset
        const testOrderWithFeeInMakerAsset3 = testOrderFactory.generateTestSignedOrder({
            makerAssetAmount: new BigNumber(150),
            takerAssetAmount: new BigNumber(250),
            takerFee: new BigNumber(50),
            takerFeeAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
            takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
            makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
        });
        it('correctly sorts by fee adjusted rate (feeless orders)', async () => {
            const orders = [testOrder1, testOrder2, testOrder3];
            const sortedOrders = sortingUtils.sortOrders(orders);
            expect(sortedOrders).to.deep.equal([testOrder2, testOrder1, testOrder3]);
        });
        it('correctly sorts by fee adjusted rate (takerAsset denominated fee orders)', async () => {
            const orders = [
                testOrderWithFeeInTakerAsset1,
                testOrderWithFeeInTakerAsset2,
                testOrderWithFeeInTakerAsset3,
            ];
            const sortedOrders = sortingUtils.sortOrders(orders);
            expect(sortedOrders).to.deep.equal([
                testOrderWithFeeInTakerAsset2,
                testOrderWithFeeInTakerAsset1,
                testOrderWithFeeInTakerAsset3,
            ]);
        });
        it('correctly sorts by fee adjusted rate (makerAsset denominated fee orders)', async () => {
            const orders = [
                testOrderWithFeeInMakerAsset1,
                testOrderWithFeeInMakerAsset2,
                testOrderWithFeeInMakerAsset3,
            ];
            const sortedOrders = sortingUtils.sortOrders(orders);
            expect(sortedOrders).to.deep.equal([
                testOrderWithFeeInMakerAsset2,
                testOrderWithFeeInMakerAsset1,
                testOrderWithFeeInMakerAsset3,
            ]);
        });
        it('correctly sorts by fee adjusted rate (mixed orders)', async () => {
            const orders = [testOrderWithFeeInMakerAsset1, testOrderWithFeeInTakerAsset2, testOrder3];
            const sortedOrders = sortingUtils.sortOrders(orders);
            expect(sortedOrders).to.deep.equal([
                testOrderWithFeeInTakerAsset2,
                testOrderWithFeeInMakerAsset1,
                testOrder3,
            ]);
        });
    });
});
