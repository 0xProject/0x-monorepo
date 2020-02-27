"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai = require("chai");
require("mocha");
var fillable_amounts_utils_1 = require("../src/utils/fillable_amounts_utils");
var chai_setup_1 = require("./utils/chai_setup");
var test_order_factory_1 = require("./utils/test_order_factory");
var utils_1 = require("./utils/utils");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
// tslint:disable:custom-no-magic-numbers
var FAKE_ERC20_TAKER_ASSET_DATA = '0xf47261b02222222222222222222222222222222222222222222222222222222222222222';
var FAKE_ERC20_MAKER_ASSET_DATA = '0xf47261b01111111111111111111111111111111111111111111111111111111111111111';
var TAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER = test_order_factory_1.testOrderFactory.generateTestSignedOrderWithFillableAmounts({
    takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
    makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
    takerFeeAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
    takerFee: utils_1.baseUnitAmount(2),
    fillableMakerAssetAmount: utils_1.baseUnitAmount(5),
    fillableTakerAssetAmount: utils_1.baseUnitAmount(10),
    fillableTakerFeeAmount: utils_1.baseUnitAmount(2),
});
var MAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER = test_order_factory_1.testOrderFactory.generateTestSignedOrderWithFillableAmounts({
    takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
    makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
    takerFeeAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
    takerFee: utils_1.baseUnitAmount(2),
    fillableMakerAssetAmount: utils_1.baseUnitAmount(10),
    fillableTakerAssetAmount: utils_1.baseUnitAmount(5),
    fillableTakerFeeAmount: utils_1.baseUnitAmount(2),
});
describe('fillableAmountsUtils', function () {
    describe('getTakerAssetAmountSwappedAfterOrderFees', function () {
        it('should return fillableTakerAssetAmount if takerFee is not denominated in taker', function () {
            var availableAssetAmount = fillable_amounts_utils_1.fillableAmountsUtils.getTakerAssetAmountSwappedAfterOrderFees(MAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER);
            expect(availableAssetAmount).to.bignumber.eq(MAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER.fillableTakerAssetAmount);
        });
        it('should return fillableTakerAssetAmount + fillableTakerFeeAmount if takerFee is not denominated in maker', function () {
            var availableAssetAmount = fillable_amounts_utils_1.fillableAmountsUtils.getTakerAssetAmountSwappedAfterOrderFees(TAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER);
            expect(availableAssetAmount).to.bignumber.eq(utils_1.baseUnitAmount(12));
        });
    });
    describe('getMakerAssetAmountSwappedAfterOrderFees', function () {
        it('should return fillableMakerAssetAmount if takerFee is not denominated in maker', function () {
            var availableAssetAmount = fillable_amounts_utils_1.fillableAmountsUtils.getMakerAssetAmountSwappedAfterOrderFees(TAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER);
            expect(availableAssetAmount).to.bignumber.eq(TAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER.fillableMakerAssetAmount);
        });
        it('should return fillableMakerAssetAmount - fillableTakerFeeif takerFee is denominated in maker', function () {
            var availableAssetAmount = fillable_amounts_utils_1.fillableAmountsUtils.getMakerAssetAmountSwappedAfterOrderFees(MAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER);
            expect(availableAssetAmount).to.bignumber.eq(utils_1.baseUnitAmount(8));
        });
    });
});
//# sourceMappingURL=fillable_amounts_utils_test.js.map