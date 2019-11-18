import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { calculateLiquidity } from '../src/utils/calculate_liquidity';

import { chaiSetup } from './utils/chai_setup';
import { testOrders } from './utils/test_orders';
import { baseUnitAmount } from './utils/utils';

chaiSetup.configure();
const expect = chai.expect;
const {
    PRUNED_SIGNED_ORDERS_FEELESS,
    PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET,
    PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET,
} = testOrders;

// tslint:disable:custom-no-magic-numbers
describe('#calculateLiquidity', () => {
    it('should provide correct liquidity result with feeless orders', () => {
        const prunedSignedOrders = PRUNED_SIGNED_ORDERS_FEELESS;
        const { makerAssetAvailableInBaseUnits, takerAssetAvailableInBaseUnits } = calculateLiquidity(
            prunedSignedOrders,
        );
        expect(makerAssetAvailableInBaseUnits).to.bignumber.eq(baseUnitAmount(10));
        expect(takerAssetAvailableInBaseUnits).to.bignumber.eq(baseUnitAmount(9));
    });
    it('should provide correct liquidity result with orders with takerFees in takerAsset', () => {
        const prunedSignedOrders = PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET;
        const { makerAssetAvailableInBaseUnits, takerAssetAvailableInBaseUnits } = calculateLiquidity(
            prunedSignedOrders,
        );
        expect(makerAssetAvailableInBaseUnits).to.bignumber.eq(baseUnitAmount(10));
        expect(takerAssetAvailableInBaseUnits).to.bignumber.eq(baseUnitAmount(15));
    });
    it('should provide correct liquidity result with orders with takerFees in makerAsset', () => {
        const prunedSignedOrders = PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET;
        const { makerAssetAvailableInBaseUnits, takerAssetAvailableInBaseUnits } = calculateLiquidity(
            prunedSignedOrders,
        );
        expect(makerAssetAvailableInBaseUnits).to.bignumber.eq(baseUnitAmount(5));
        expect(takerAssetAvailableInBaseUnits).to.bignumber.eq(baseUnitAmount(9));
    });
    it('should provide correct liquidity result with mixed orders with fees and no fees', () => {
        const prunedSignedOrders = _.concat(
            PRUNED_SIGNED_ORDERS_FEE_IN_MAKER_ASSET,
            PRUNED_SIGNED_ORDERS_FEE_IN_TAKER_ASSET,
            PRUNED_SIGNED_ORDERS_FEELESS,
        );
        const { makerAssetAvailableInBaseUnits, takerAssetAvailableInBaseUnits } = calculateLiquidity(
            prunedSignedOrders,
        );
        expect(makerAssetAvailableInBaseUnits).to.bignumber.eq(baseUnitAmount(25));
        expect(takerAssetAvailableInBaseUnits).to.bignumber.eq(baseUnitAmount(33));
    });
});
