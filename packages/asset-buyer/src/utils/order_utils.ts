import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

import { constants } from '../constants';

export const orderUtils = {
    isOrderExpired(order: SignedOrder): boolean {
        return orderUtils.willOrderExpire(order, 0);
    },
    willOrderExpire(order: SignedOrder, secondsFromNow: number): boolean {
        const millisecondsInSecond = 1000;
        const currentUnixTimestampSec = new BigNumber(Date.now() / millisecondsInSecond).round();
        return order.expirationTimeSeconds.lessThan(currentUnixTimestampSec.plus(secondsFromNow));
    },
    calculateRemainingMakerAssetAmount(order: SignedOrder, remainingTakerAssetAmount: BigNumber): BigNumber {
        if (remainingTakerAssetAmount.eq(0)) {
            return constants.ZERO_AMOUNT;
        }
        return remainingTakerAssetAmount.times(order.makerAssetAmount).dividedToIntegerBy(order.takerAssetAmount);
    },
    calculateRemainingTakerAssetAmount(order: SignedOrder, remainingMakerAssetAmount: BigNumber): BigNumber {
        if (remainingMakerAssetAmount.eq(0)) {
            return constants.ZERO_AMOUNT;
        }
        return remainingMakerAssetAmount.times(order.takerAssetAmount).dividedToIntegerBy(order.makerAssetAmount);
    },
    isOpenOrder(order: SignedOrder): boolean {
        return order.takerAddress === constants.NULL_ADDRESS;
    },
};
