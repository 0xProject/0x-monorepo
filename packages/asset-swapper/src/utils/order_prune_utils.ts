import { orderCalculationUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import * as _ from 'lodash';

import { constants } from '../constants';
import { OrderPrunerPermittedFeeTypes } from '../types';
import { utils } from '../utils/utils';

export const orderPrunerUtils = {
    prunedForUsableSignedOrders(
        signedOrders: SignedOrder[],
        permittedOrderFeeTypes: Set<OrderPrunerPermittedFeeTypes>,
        expiryBufferMs: number,
    ): SignedOrder[] {
        const result = _.filter(signedOrders, order => {
            return (
                orderCalculationUtils.isOpenOrder(order) &&
                !orderCalculationUtils.willOrderExpire(order, expiryBufferMs / constants.ONE_SECOND_MS) &&
                ((permittedOrderFeeTypes.has(OrderPrunerPermittedFeeTypes.NoFees) &&
                order.takerFee.eq(constants.ZERO_AMOUNT)) ||
                (permittedOrderFeeTypes.has(OrderPrunerPermittedFeeTypes.TakerDenominatedTakerFee) &&
                    utils.isOrderTakerFeePayableWithTakerAsset(order)) ||
                (permittedOrderFeeTypes.has(OrderPrunerPermittedFeeTypes.MakerDenominatedTakerFee) &&
                    utils.isOrderTakerFeePayableWithMakerAsset(order)))
            );
        });
        return result;
    },
};
