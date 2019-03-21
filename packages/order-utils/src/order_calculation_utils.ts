import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { constants } from './constants';
import { BalanceAndAllowance } from './types';

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
    /**
     * Given a desired amount of ZRX from a fee order, calculate the amount of taker asset required to fill.
     * Also calculate how much ZRX needs to be purchased in order to fill the desired amount plus the taker fee amount
     * @param order The order
     * @param makerFillAmount the amount of maker asset
     */
    getTakerFillAmountForFeeOrder(order: Order, makerFillAmount: BigNumber): [BigNumber, BigNumber] {
        // For each unit of TakerAsset we buy (MakerAsset - TakerFee)
        const adjustedTakerFillAmount = makerFillAmount
            .multipliedBy(order.takerAssetAmount)
            .div(order.makerAssetAmount.minus(order.takerFee))
            .integerValue(BigNumber.ROUND_CEIL);
        // The amount that we buy will be greater than makerFillAmount, since we buy some amount for fees.
        const adjustedMakerFillAmount = orderCalculationUtils.getMakerFillAmount(order, adjustedTakerFillAmount);
        return [adjustedTakerFillAmount, adjustedMakerFillAmount];
    },
    /**
     * Calculates the remaining fillable amount for an order given:
     *      order filled amount
     *      asset balance/allowance (maker/taker)
     *      ZRX fee balance/allowance (maker/taker)
     * Taker values are checked if specified in the order. For example, if the maker does not
     * have sufficient ZRX allowance to pay the fee, then this function will return the maximum
     * amount that can be filled given the maker's ZRX allowance
     * @param order The order
     * @param takerAssetFilledAmount The amount currently filled on the order
     * @param makerAssetBalanceAllowance The makerAsset balance and allowance of the maker
     * @param makerZRXBalanceAllowance The ZRX balance and allowance of the maker
     * @param takerAssetBalanceAllowance The takerAsset balance and allowance of the taker
     * @param takerZRXBalanceAllowance The ZRX balance and allowance of the taker
     */
    calculateRemainingFillableTakerAssetAmount(
        order: Order,
        takerAssetFilledAmount: BigNumber,
        makerAssetBalanceAllowance: BalanceAndAllowance,
        makerZRXBalanceAllowance: BalanceAndAllowance,
        takerAssetBalanceAllowance?: BalanceAndAllowance,
        takerZRXBalanceAllowance?: BalanceAndAllowance,
    ): BigNumber {
        const minSet = [];

        // Calculate min of balance & allowance of taker's takerAsset
        if (order.takerAddress !== constants.NULL_ADDRESS) {
            if (takerAssetBalanceAllowance && takerZRXBalanceAllowance) {
                const maxTakerAssetFillAmountGivenTakerConstraints = BigNumber.min(
                    takerAssetBalanceAllowance.balance,
                    takerAssetBalanceAllowance.allowance,
                );
                minSet.push(
                    maxTakerAssetFillAmountGivenTakerConstraints,
                    takerAssetBalanceAllowance.balance,
                    takerAssetBalanceAllowance.allowance,
                );
            }
        }

        // Calculate min of balance & allowance of maker's makerAsset -> translate into takerAsset amount
        const maxMakerAssetFillAmount = BigNumber.min(
            makerAssetBalanceAllowance.balance,
            makerAssetBalanceAllowance.allowance,
        );
        const maxTakerAssetFillAmountGivenMakerConstraints = orderCalculationUtils.getTakerFillAmount(
            order,
            maxMakerAssetFillAmount,
        );
        minSet.push(maxTakerAssetFillAmountGivenMakerConstraints);

        // Calculate min of balance & allowance of taker's ZRX -> translate into takerAsset amount
        if (!order.takerFee.eq(0) && order.takerAddress !== constants.NULL_ADDRESS) {
            if (takerAssetBalanceAllowance && takerZRXBalanceAllowance) {
                const takerZRXAvailable = BigNumber.min(
                    takerZRXBalanceAllowance.balance,
                    takerZRXBalanceAllowance.allowance,
                );
                const maxTakerAssetFillAmountGivenTakerZRXConstraints = takerZRXAvailable
                    .multipliedBy(order.takerAssetAmount)
                    .div(order.takerFee)
                    .integerValue(BigNumber.ROUND_CEIL); // Should this round to ciel or floor?
                minSet.push(maxTakerAssetFillAmountGivenTakerZRXConstraints);
            }
        }

        // Calculate min of balance & allowance of maker's ZRX -> translate into takerAsset amount
        if (!order.makerFee.eq(0)) {
            const makerZRXAvailable = BigNumber.min(
                makerZRXBalanceAllowance.balance,
                makerZRXBalanceAllowance.allowance,
            );
            const maxTakerAssetFillAmountGivenMakerZRXConstraints = makerZRXAvailable
                .multipliedBy(order.takerAssetAmount)
                .div(order.makerFee)
                .integerValue(BigNumber.ROUND_CEIL); // Should this round to ciel or floor?
            minSet.push(maxTakerAssetFillAmountGivenMakerZRXConstraints);
        }

        const remainingTakerAssetFillAmount = order.takerAssetAmount.minus(takerAssetFilledAmount);
        minSet.push(remainingTakerAssetFillAmount);

        const maxTakerAssetFillAmount = BigNumber.min(...minSet);
        return maxTakerAssetFillAmount;
    },
};
