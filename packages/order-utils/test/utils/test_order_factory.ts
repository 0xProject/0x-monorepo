import { Order, OrderRelevantState, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { constants, orderFactory } from '../../src';

const BASE_TEST_ORDER: Order = orderFactory.createOrder(
    constants.NULL_ADDRESS,
    constants.NULL_ADDRESS,
    constants.NULL_ADDRESS,
    constants.ZERO_AMOUNT,
    constants.ZERO_AMOUNT,
    constants.ZERO_AMOUNT,
    constants.NULL_BYTES,
    constants.ZERO_AMOUNT,
    constants.NULL_BYTES,
    constants.NULL_ADDRESS,
    constants.NULL_ADDRESS,
);
const BASE_TEST_SIGNED_ORDER: SignedOrder = {
    ...BASE_TEST_ORDER,
    signature: constants.NULL_BYTES,
};
const BASE_TEST_ORDER_RELEVANT_STATE: OrderRelevantState = {
    makerBalance: constants.ZERO_AMOUNT,
    makerProxyAllowance: constants.ZERO_AMOUNT,
    makerFeeBalance: constants.ZERO_AMOUNT,
    makerFeeProxyAllowance: constants.ZERO_AMOUNT,
    filledTakerAssetAmount: constants.ZERO_AMOUNT,
    remainingFillableMakerAssetAmount: constants.ZERO_AMOUNT,
    remainingFillableTakerAssetAmount: constants.ZERO_AMOUNT,
};

export const testOrderFactory = {
    generateTestSignedOrder(partialOrder: Partial<SignedOrder>): SignedOrder {
        return transformObject(BASE_TEST_SIGNED_ORDER, partialOrder);
    },
    generateTestSignedOrders(partialOrder: Partial<SignedOrder>, numOrders: number): SignedOrder[] {
        const baseTestOrders = generateArrayOfInput(BASE_TEST_SIGNED_ORDER, numOrders);
        return transformObjects(baseTestOrders, partialOrder);
    },
    generateTestOrderRelevantState(partialOrderRelevantState: Partial<OrderRelevantState>): OrderRelevantState {
        return transformObject(BASE_TEST_ORDER_RELEVANT_STATE, partialOrderRelevantState);
    },
    generateTestOrderRelevantStates(
        partialOrderRelevantState: Partial<OrderRelevantState>,
        numOrderStates: number,
    ): OrderRelevantState[] {
        const baseTestOrderStates = generateArrayOfInput(BASE_TEST_ORDER_RELEVANT_STATE, numOrderStates);
        return transformObjects(baseTestOrderStates, partialOrderRelevantState);
    },
};

function generateArrayOfInput<T>(input: T, rangeLength: number): T[] {
    return _.map(_.range(rangeLength), () => input);
}
function transformObject<T>(input: T, transformation: Partial<T>): T {
    const copy = _.cloneDeep(input);
    return _.assign(copy, transformation);
}
function transformObjects<T>(inputs: T[], transformation: Partial<T>): T[] {
    return _.map(inputs, input => transformObject(input, transformation));
}
