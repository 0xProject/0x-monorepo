import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { constants } from './constants';

export const orderCalculationUtils = {
    /**
     * Determines if the order is expired given the current time
     * @param order The order for expiry calculation
     */
    isOrderExpired(order: Order): boolean {
        return orderCalculationUtils.willOrderExpire(order, 0);
    },
    /**
     * Calculates if the order will expire in the future.
     * @param order The order for expiry calculation
     * @param secondsFromNow The amount of seconds from current time
     */
    willOrderExpire(order: Order, secondsFromNow: number): boolean {
        const millisecondsInSecond = 1000;
        const currentUnixTimestampSec = new BigNumber(Date.now() / millisecondsInSecond).integerValue();
        return order.expirationTimeSeconds.isLessThan(currentUnixTimestampSec.plus(secondsFromNow));
    },
    /**
     * Determines if the order is open and fillable by any taker.
     * @param order The order
     */
    isOpenOrder(order: Order): boolean {
        return order.takerAddress === constants.NULL_ADDRESS;
    },
    /**
     * Given an amount of taker asset, calculate the the amount of maker asset
     * @param order The order
     * @param makerFillAmount the amount of taker asset
     */
    getMakerFillAmount(order: Order, takerFillAmount: BigNumber): BigNumber {
        // Round down because exchange rate favors Maker
        const makerFillAmount = takerFillAmount
            .multipliedBy(order.makerAssetAmount)
            .div(order.takerAssetAmount)
            .integerValue(BigNumber.ROUND_FLOOR);
        return makerFillAmount;
    },
    /**
     * Given an amount of maker asset, calculate the equivalent amount in taker asset
     * @param order The order
     * @param makerFillAmount the amount of maker asset
     */
    getTakerFillAmount(order: Order, makerFillAmount: BigNumber): BigNumber {
        // Round up because exchange rate favors Maker
        const takerFillAmount = makerFillAmount
            .multipliedBy(order.takerAssetAmount)
            .div(order.makerAssetAmount)
            .integerValue(BigNumber.ROUND_CEIL);
        return takerFillAmount;
    },
    /**
     * Given an amount of taker asset, calculate the fee amount required for the taker
     * @param order The order
     * @param takerFillAmount the amount of taker asset
     */
    getTakerFeeAmount(order: Order, takerFillAmount: BigNumber): BigNumber {
        // Round down because Taker fee rate favors Taker
        const takerFeeAmount = takerFillAmount
            .multipliedBy(order.takerFee)
            .div(order.takerAssetAmount)
            .integerValue(BigNumber.ROUND_FLOOR);
        return takerFeeAmount;
    },
    /**
     * Given an amount of maker asset, calculate the fee amount required for the maker
     * @param order The order
     * @param makerFillAmount the amount of maker asset
     */
    getMakerFeeAmount(order: Order, makerFillAmount: BigNumber): BigNumber {
        // Round down because Maker fee rate favors Maker
        const makerFeeAmount = makerFillAmount
            .multipliedBy(order.makerFee)
            .div(order.makerAssetAmount)
            .integerValue(BigNumber.ROUND_FLOOR);
        return makerFeeAmount;
    },
};
