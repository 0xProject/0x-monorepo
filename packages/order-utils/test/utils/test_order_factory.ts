import { Order, SignedOrder } from '@0x/types';
import * as _ from 'lodash';

import { constants } from '../../src/constants';
import { orderFactory } from '../../src/order_factory';

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

export const testOrderFactory = {
    generateTestSignedOrder(partialOrder: Partial<SignedOrder>): SignedOrder {
        return transformObject(BASE_TEST_SIGNED_ORDER, partialOrder);
    },
    generateTestSignedOrders(partialOrder: Partial<SignedOrder>, numOrders: number): SignedOrder[] {
        const baseTestOrders = _.map(_.range(numOrders), () => BASE_TEST_SIGNED_ORDER);
        return _.map(baseTestOrders, order => transformObject(order, partialOrder));
    },
};

function transformObject<T>(input: T, transformation: Partial<T>): T {
    const copy = _.cloneDeep(input);
    return _.assign(copy, transformation);
}
