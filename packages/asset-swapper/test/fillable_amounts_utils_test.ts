import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { fillableAmountsUtils } from '../src/utils/fillable_amounts_utils';

import { chaiSetup } from './utils/chai_setup';
import { testOrderFactory } from './utils/test_order_factory';
import { baseUnitAmount } from './utils/utils';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
const FAKE_ERC20_TAKER_ASSET_DATA = '0xf47261b02222222222222222222222222222222222222222222222222222222222222222';
const FAKE_ERC20_MAKER_ASSET_DATA = '0xf47261b01111111111111111111111111111111111111111111111111111111111111111';

const TAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER = testOrderFactory.generateTestSignedOrderWithFillableAmounts({
    takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
    makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
    takerFeeAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
    takerFee: baseUnitAmount(2),
    fillableMakerAssetAmount: baseUnitAmount(5),
    fillableTakerAssetAmount: baseUnitAmount(10),
    fillableTakerFeeAmount: baseUnitAmount(2),
});

const MAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER = testOrderFactory.generateTestSignedOrderWithFillableAmounts({
    takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
    makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
    takerFeeAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
    takerFee: baseUnitAmount(2),
    fillableMakerAssetAmount: baseUnitAmount(10),
    fillableTakerAssetAmount: baseUnitAmount(5),
    fillableTakerFeeAmount: baseUnitAmount(2),
});

describe('fillableAmountsUtils', () => {
    describe('getTakerAssetAmountSwappedAfterOrderFees', () => {
        it('should return fillableTakerAssetAmount if takerFee is not denominated in taker', () => {
            const availableAssetAmount = fillableAmountsUtils.getTakerAssetAmountSwappedAfterOrderFees(
                MAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER,
            );
            expect(availableAssetAmount).to.bignumber.eq(
                MAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER.fillableTakerAssetAmount,
            );
        });

        it('should return fillableTakerAssetAmount + fillableTakerFeeAmount if takerFee is not denominated in maker', () => {
            const availableAssetAmount = fillableAmountsUtils.getTakerAssetAmountSwappedAfterOrderFees(
                TAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER,
            );
            expect(availableAssetAmount).to.bignumber.eq(baseUnitAmount(12));
        });
    });
    describe('getMakerAssetAmountSwappedAfterOrderFees', () => {
        it('should return fillableMakerAssetAmount if takerFee is not denominated in maker', () => {
            const availableAssetAmount = fillableAmountsUtils.getMakerAssetAmountSwappedAfterOrderFees(
                TAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER,
            );
            expect(availableAssetAmount).to.bignumber.eq(
                TAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER.fillableMakerAssetAmount,
            );
        });

        it('should return fillableMakerAssetAmount - fillableTakerFeeif takerFee is denominated in maker', () => {
            const availableAssetAmount = fillableAmountsUtils.getMakerAssetAmountSwappedAfterOrderFees(
                MAKER_ASSET_DENOMINATED_TAKER_FEE_ORDER,
            );
            expect(availableAssetAmount).to.bignumber.eq(baseUnitAmount(8));
        });
    });
});
