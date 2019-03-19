import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { constants } from './constants';
import { BalanceAndAllowance } from './types';

export const orderCalculationUtils = {
    getTakerFillAmount(order: Order, makerFillAmount: BigNumber): BigNumber {
        // Round up because exchange rate favors Maker
        const takerFillAmount = makerFillAmount
            .multipliedBy(order.takerAssetAmount)
            .div(order.makerAssetAmount)
            .integerValue(BigNumber.ROUND_CEIL);
        return takerFillAmount;
    },
    // given a desired amount of takerAsset to fill, calculate how much makerAsset will be filled
    getMakerFillAmount(order: Order, takerFillAmount: BigNumber): BigNumber {
        // Round down because exchange rate favors Maker
        const makerFillAmount = takerFillAmount
            .multipliedBy(order.makerAssetAmount)
            .div(order.takerAssetAmount)
            .integerValue(BigNumber.ROUND_FLOOR);
        return makerFillAmount;
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
