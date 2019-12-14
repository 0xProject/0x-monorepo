import { SignedOrderWithFillableAmounts } from '../../src/types';

import { testOrderFactory } from './test_order_factory';
import { baseUnitAmount } from './utils';

// tslint:disable:custom-no-magic-numbers

const FAKE_ERC20_TAKER_ASSET_DATA = '0xf47261b02222222222222222222222222222222222222222222222222222222222222222';
const FAKE_ERC20_MAKER_ASSET_DATA = '0xf47261b01111111111111111111111111111111111111111111111111111111111111111';

const PARTIAL_ORDER: Partial<SignedOrderWithFillableAmounts> = {
    takerAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
    makerAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
};

const PARTIAL_ORDER_FEE_IN_TAKER_ASSET: Partial<SignedOrderWithFillableAmounts> = {
    ...{
        takerFeeAssetData: FAKE_ERC20_TAKER_ASSET_DATA,
    },
    ...PARTIAL_ORDER,
};

const PARTIAL_ORDER_FEE_IN_MAKER_ASSET: Partial<SignedOrderWithFillableAmounts> = {
    ...{
        takerFeeAssetData: FAKE_ERC20_MAKER_ASSET_DATA,
    },
    ...PARTIAL_ORDER,
};

const PARTIAL_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS: Array<Partial<SignedOrderWithFillableAmounts>> = [
    {
        ...{
            takerAssetAmount: baseUnitAmount(1),
            makerAssetAmount: baseUnitAmount(6),
            fillableTakerAssetAmount: baseUnitAmount(1),
            fillableMakerAssetAmount: baseUnitAmount(6),
        },
        ...PARTIAL_ORDER,
    },
    {
        ...{
            takerAssetAmount: baseUnitAmount(10),
            makerAssetAmount: baseUnitAmount(4),
            fillableTakerAssetAmount: baseUnitAmount(5),
            fillableMakerAssetAmount: baseUnitAmount(2),
        },
        ...PARTIAL_ORDER,
    },
    {
        ...{
            takerAssetAmount: baseUnitAmount(6),
            makerAssetAmount: baseUnitAmount(6),
            fillableTakerAssetAmount: baseUnitAmount(3),
            fillableMakerAssetAmount: baseUnitAmount(2),
        },
        ...PARTIAL_ORDER,
    },
];

const PARTIAL_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET: Array<Partial<SignedOrderWithFillableAmounts>> = [
    {
        ...{
            takerAssetAmount: baseUnitAmount(1),
            makerAssetAmount: baseUnitAmount(6),
            takerFee: baseUnitAmount(3),
            fillableTakerAssetAmount: baseUnitAmount(1),
            fillableMakerAssetAmount: baseUnitAmount(6),
            fillableTakerFeeAmount: baseUnitAmount(3),
        },
        ...PARTIAL_ORDER_FEE_IN_TAKER_ASSET,
    },
    {
        ...{
            takerAssetAmount: baseUnitAmount(10),
            makerAssetAmount: baseUnitAmount(4),
            takerFee: baseUnitAmount(2),
            fillableTakerAssetAmount: baseUnitAmount(5),
            fillableMakerAssetAmount: baseUnitAmount(2),
            fillableTakerFeeAmount: baseUnitAmount(1),
        },
        ...PARTIAL_ORDER_FEE_IN_TAKER_ASSET,
    },
    {
        ...{
            takerAssetAmount: baseUnitAmount(6),
            makerAssetAmount: baseUnitAmount(6),
            takerFee: baseUnitAmount(4),
            fillableTakerAssetAmount: baseUnitAmount(3),
            fillableMakerAssetAmount: baseUnitAmount(2),
            fillableTakerFeeAmount: baseUnitAmount(2),
        },
        ...PARTIAL_ORDER_FEE_IN_TAKER_ASSET,
    },
];

const PARTIAL_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET: Array<Partial<SignedOrderWithFillableAmounts>> = [
    {
        ...{
            takerAssetAmount: baseUnitAmount(5),
            makerAssetAmount: baseUnitAmount(2),
            takerFee: baseUnitAmount(1),
            fillableTakerAssetAmount: baseUnitAmount(5),
            fillableMakerAssetAmount: baseUnitAmount(2),
            fillableTakerFeeAmount: baseUnitAmount(1),
        },
        ...PARTIAL_ORDER_FEE_IN_MAKER_ASSET,
    },
    {
        ...{
            takerAssetAmount: baseUnitAmount(2),
            makerAssetAmount: baseUnitAmount(12),
            takerFee: baseUnitAmount(6),
            fillableTakerAssetAmount: baseUnitAmount(1),
            fillableMakerAssetAmount: baseUnitAmount(6),
            fillableTakerFeeAmount: baseUnitAmount(3),
        },
        ...PARTIAL_ORDER_FEE_IN_MAKER_ASSET,
    },
    {
        ...{
            takerAssetAmount: baseUnitAmount(3),
            makerAssetAmount: baseUnitAmount(3),
            takerFee: baseUnitAmount(2),
            fillableTakerAssetAmount: baseUnitAmount(3),
            fillableMakerAssetAmount: baseUnitAmount(3),
            fillableTakerFeeAmount: baseUnitAmount(2),
        },
        ...PARTIAL_ORDER_FEE_IN_MAKER_ASSET,
    },
];

const SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS = testOrderFactory.generateTestSignedOrdersWithFillableAmounts(
    PARTIAL_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
);
const SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET = testOrderFactory.generateTestSignedOrdersWithFillableAmounts(
    PARTIAL_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
);
const SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET = testOrderFactory.generateTestSignedOrdersWithFillableAmounts(
    PARTIAL_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
);

export const testOrders = {
    SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEELESS,
    SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_TAKER_ASSET,
    SIGNED_ORDERS_WITH_FILLABLE_AMOUNTS_FEE_IN_MAKER_ASSET,
};
