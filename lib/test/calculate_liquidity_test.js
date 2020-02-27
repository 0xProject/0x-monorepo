"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai = require("chai");
var _ = require("lodash");
require("mocha");
var calculate_liquidity_1 = require("../src/utils/calculate_liquidity");
var chai_setup_1 = require("./utils/chai_setup");
var test_orders_1 = require("./utils/test_orders");
var utils_1 = require("./utils/utils");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
var SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS = test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS, SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET = test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET, SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET = test_orders_1.testOrders.SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET;
// tslint:disable:custom-no-magic-numbers
describe('#calculateLiquidity', function () {
    it('should provide correct liquidity result with feeless orders', function () {
        var prunedSignedOrders = SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS;
        var _a = calculate_liquidity_1.calculateLiquidity(prunedSignedOrders), makerAssetAvailableInBaseUnits = _a.makerAssetAvailableInBaseUnits, takerAssetAvailableInBaseUnits = _a.takerAssetAvailableInBaseUnits;
        expect(makerAssetAvailableInBaseUnits).to.bignumber.eq(utils_1.baseUnitAmount(11));
        expect(takerAssetAvailableInBaseUnits).to.bignumber.eq(utils_1.baseUnitAmount(9));
    });
    it('should provide correct liquidity result with orders with takerFees in takerAsset', function () {
        var prunedSignedOrders = SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET;
        var _a = calculate_liquidity_1.calculateLiquidity(prunedSignedOrders), makerAssetAvailableInBaseUnits = _a.makerAssetAvailableInBaseUnits, takerAssetAvailableInBaseUnits = _a.takerAssetAvailableInBaseUnits;
        expect(makerAssetAvailableInBaseUnits).to.bignumber.eq(utils_1.baseUnitAmount(11));
        expect(takerAssetAvailableInBaseUnits).to.bignumber.eq(utils_1.baseUnitAmount(15));
    });
    it('should provide correct liquidity result with orders with takerFees in makerAsset', function () {
        var prunedSignedOrders = SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET;
        var _a = calculate_liquidity_1.calculateLiquidity(prunedSignedOrders), makerAssetAvailableInBaseUnits = _a.makerAssetAvailableInBaseUnits, takerAssetAvailableInBaseUnits = _a.takerAssetAvailableInBaseUnits;
        expect(makerAssetAvailableInBaseUnits).to.bignumber.eq(utils_1.baseUnitAmount(5));
        expect(takerAssetAvailableInBaseUnits).to.bignumber.eq(utils_1.baseUnitAmount(9));
    });
    it('should provide correct liquidity result with mixed orders with fees and no fees', function () {
        var prunedSignedOrders = _.concat(SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET, SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET, SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS);
        var _a = calculate_liquidity_1.calculateLiquidity(prunedSignedOrders), makerAssetAvailableInBaseUnits = _a.makerAssetAvailableInBaseUnits, takerAssetAvailableInBaseUnits = _a.takerAssetAvailableInBaseUnits;
        expect(makerAssetAvailableInBaseUnits).to.bignumber.eq(utils_1.baseUnitAmount(27));
        expect(takerAssetAvailableInBaseUnits).to.bignumber.eq(utils_1.baseUnitAmount(33));
    });
});
//# sourceMappingURL=calculate_liquidity_test.js.map