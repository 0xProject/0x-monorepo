"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var test_order_factory_1 = require("./test_order_factory");
var utils_1 = require("./utils");
// tslint:disable:custom-no-magic-numbers
var FAKE_ERC20_TAKER_ASSET_DATA = '0xf47261b02222222222222222222222222222222222222222222222222222222222222222';
var FAKE_ERC20_MAKER_ASSET_DATA = '0xf47261b01111111111111111111111111111111111111111111111111111111111111111';
var PARTIAL_ORDER = {
    takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
    makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
};
var PARTIAL_ORDER_FEE_IN_TAKER_ASSET = __assign({
    takerFeeAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
}, PARTIAL_ORDER);
var PARTIAL_ORDER_FEE_IN_MAKER_ASSET = __assign({
    takerFeeAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
}, PARTIAL_ORDER);
var PARTIAL_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS = [
    __assign({
        takerAssetAmount: utils_1.baseUnitAmount(1),
        makerAssetAmount: utils_1.baseUnitAmount(6),
        fillableTakerAssetAmount: utils_1.baseUnitAmount(1),
        fillableMakerAssetAmount: utils_1.baseUnitAmount(6),
    }, PARTIAL_ORDER),
    __assign({
        takerAssetAmount: utils_1.baseUnitAmount(10),
        makerAssetAmount: utils_1.baseUnitAmount(4),
        fillableTakerAssetAmount: utils_1.baseUnitAmount(5),
        fillableMakerAssetAmount: utils_1.baseUnitAmount(2),
    }, PARTIAL_ORDER),
    __assign({
        takerAssetAmount: utils_1.baseUnitAmount(6),
        makerAssetAmount: utils_1.baseUnitAmount(6),
        fillableTakerAssetAmount: utils_1.baseUnitAmount(3),
        fillableMakerAssetAmount: utils_1.baseUnitAmount(3),
    }, PARTIAL_ORDER),
];
var PARTIAL_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET = [
    __assign({
        takerAssetAmount: utils_1.baseUnitAmount(1),
        makerAssetAmount: utils_1.baseUnitAmount(6),
        takerFee: utils_1.baseUnitAmount(3),
        fillableTakerAssetAmount: utils_1.baseUnitAmount(1),
        fillableMakerAssetAmount: utils_1.baseUnitAmount(6),
        fillableTakerFeeAmount: utils_1.baseUnitAmount(3),
    }, PARTIAL_ORDER_FEE_IN_TAKER_ASSET),
    __assign({
        takerAssetAmount: utils_1.baseUnitAmount(10),
        makerAssetAmount: utils_1.baseUnitAmount(4),
        takerFee: utils_1.baseUnitAmount(2),
        fillableTakerAssetAmount: utils_1.baseUnitAmount(5),
        fillableMakerAssetAmount: utils_1.baseUnitAmount(2),
        fillableTakerFeeAmount: utils_1.baseUnitAmount(1),
    }, PARTIAL_ORDER_FEE_IN_TAKER_ASSET),
    __assign({
        takerAssetAmount: utils_1.baseUnitAmount(6),
        makerAssetAmount: utils_1.baseUnitAmount(6),
        takerFee: utils_1.baseUnitAmount(4),
        fillableTakerAssetAmount: utils_1.baseUnitAmount(3),
        fillableMakerAssetAmount: utils_1.baseUnitAmount(3),
        fillableTakerFeeAmount: utils_1.baseUnitAmount(2),
    }, PARTIAL_ORDER_FEE_IN_TAKER_ASSET),
];
var PARTIAL_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET = [
    __assign({
        takerAssetAmount: utils_1.baseUnitAmount(5),
        makerAssetAmount: utils_1.baseUnitAmount(2),
        takerFee: utils_1.baseUnitAmount(1),
        fillableTakerAssetAmount: utils_1.baseUnitAmount(5),
        fillableMakerAssetAmount: utils_1.baseUnitAmount(2),
        fillableTakerFeeAmount: utils_1.baseUnitAmount(1),
    }, PARTIAL_ORDER_FEE_IN_MAKER_ASSET),
    __assign({
        takerAssetAmount: utils_1.baseUnitAmount(2),
        makerAssetAmount: utils_1.baseUnitAmount(12),
        takerFee: utils_1.baseUnitAmount(6),
        fillableTakerAssetAmount: utils_1.baseUnitAmount(1),
        fillableMakerAssetAmount: utils_1.baseUnitAmount(6),
        fillableTakerFeeAmount: utils_1.baseUnitAmount(3),
    }, PARTIAL_ORDER_FEE_IN_MAKER_ASSET),
    __assign({
        takerAssetAmount: utils_1.baseUnitAmount(3),
        makerAssetAmount: utils_1.baseUnitAmount(3),
        takerFee: utils_1.baseUnitAmount(2),
        fillableTakerAssetAmount: utils_1.baseUnitAmount(3),
        fillableMakerAssetAmount: utils_1.baseUnitAmount(3),
        fillableTakerFeeAmount: utils_1.baseUnitAmount(2),
    }, PARTIAL_ORDER_FEE_IN_MAKER_ASSET),
];
var SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS = test_order_factory_1.testOrderFactory.generateTestSignedOrdersWithFillableAmounts(PARTIAL_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS);
var SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET = test_order_factory_1.testOrderFactory.generateTestSignedOrdersWithFillableAmounts(PARTIAL_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET);
var SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET = test_order_factory_1.testOrderFactory.generateTestSignedOrdersWithFillableAmounts(PARTIAL_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET);
exports.testOrders = {
    SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS: SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
    SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET: SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
    SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET: SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
};
//# sourceMappingURL=test_orders.js.map