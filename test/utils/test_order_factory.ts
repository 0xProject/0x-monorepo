import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { Order, SignedOrder } from '@0x/types';
import * as _ from 'lodash';

import { constants } from '../../src/constants';
import { SignedOrderWithFillableAmounts } from '../../src/types';

const CHAIN_ID = 1337;
const BASE_TEST_ORDER: Order = orderFactory.createOrder(
    constants.NULL_ADDRESS,
    constants.ZERO_AMOUNT,
    constants.NULL_ERC20_ASSET_DATA,
    constants.ZERO_AMOUNT,
    constants.NULL_ERC20_ASSET_DATA,
    constants.NULL_ADDRESS,
    CHAIN_ID,
);

const BASE_TEST_SIGNED_ORDER: SignedOrder = {
    ...BASE_TEST_ORDER,
    signature: constants.NULL_BYTES,
};

const BASE_TEST_PRUNED_SIGNED_ORDER: SignedOrderWithFillableAmounts = {
    ...BASE_TEST_SIGNED_ORDER,
    fillableMakerAssetAmount: constants.ZERO_AMOUNT,
    fillableTakerAssetAmount: constants.ZERO_AMOUNT,
    fillableTakerFeeAmount: constants.ZERO_AMOUNT,
};

export const testOrderFactory = {
    generateTestSignedOrder(partialOrder: Partial<SignedOrder>): SignedOrder {
        return transformObject(BASE_TEST_SIGNED_ORDER, partialOrder);
    },
    generateIdenticalTestSignedOrders(partialOrder: Partial<SignedOrder>, numOrders: number): SignedOrder[] {
        const baseTestOrders = _.map(_.range(numOrders), () => BASE_TEST_SIGNED_ORDER);
        return _.map(baseTestOrders, order => transformObject(order, partialOrder));
    },
    generateTestSignedOrders(partialOrders: Array<Partial<SignedOrder>>): SignedOrder[] {
        return _.map(partialOrders, partialOrder => transformObject(BASE_TEST_SIGNED_ORDER, partialOrder));
    },
    generateTestSignedOrderWithFillableAmounts(
        partialOrder: Partial<SignedOrderWithFillableAmounts>,
    ): SignedOrderWithFillableAmounts {
        return transformObject(BASE_TEST_PRUNED_SIGNED_ORDER, partialOrder);
    },
    generateIdenticalTestSignedOrdersWithFillableAmounts(
        partialOrder: Partial<SignedOrderWithFillableAmounts>,
        numOrders: number,
    ): SignedOrderWithFillableAmounts[] {
        const baseTestOrders = _.map(_.range(numOrders), () => BASE_TEST_PRUNED_SIGNED_ORDER);
        return _.map(
            baseTestOrders,
            (baseOrder): SignedOrderWithFillableAmounts => transformObject(baseOrder, partialOrder),
        );
    },
    generateTestSignedOrdersWithFillableAmounts(
        partialOrders: Array<Partial<SignedOrderWithFillableAmounts>>,
    ): SignedOrderWithFillableAmounts[] {
        return _.map(
            partialOrders,
            (partialOrder): SignedOrderWithFillableAmounts =>
                transformObject(BASE_TEST_PRUNED_SIGNED_ORDER, partialOrder),
        );
    },
};

function transformObject<T>(input: T, transformation: Partial<T>): T {
    const copy = _.cloneDeep(input);
    return _.assign(copy, transformation);
}
