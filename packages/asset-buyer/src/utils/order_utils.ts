import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

import { constants } from '../constants';

export const orderUtils = {
    isOrderExpired(order: SignedOrder): boolean {
        const millisecondsInSecond = 1000;
        const currentUnixTimestampSec = new BigNumber(Date.now() / millisecondsInSecond).round();
        return order.expirationTimeSeconds.lessThan(currentUnixTimestampSec);
    },
    calculateRemainingMakerAssetAmount(order: SignedOrder, remainingTakerAssetAmount: BigNumber): BigNumber {
        const result = remainingTakerAssetAmount.eq(0)
            ? constants.ZERO_AMOUNT
            : remainingTakerAssetAmount.times(order.makerAssetAmount).dividedToIntegerBy(order.takerAssetAmount);
        return result;
    },
    isOpenOrder(order: SignedOrder): boolean {
        return order.takerAddress === constants.NULL_ADDRESS;
    },
};
