import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import { MarketOperation, SignedOrderWithFillableAmounts } from '../types';

import { assert } from './assert';
import { utils } from './utils';

export const marketUtils = {
    findOrdersThatCoverTakerAssetFillAmount(
        sortedOrders: SignedOrder[],
        takerAssetFillAmount: BigNumber,
        slippageBufferAmount: BigNumber = new BigNumber(0),
    ): { resultOrders: SignedOrder[]; remainingFillAmount: BigNumber } {
        return findOrdersThatCoverAssetFillAmount(
            sortedOrders,
            takerAssetFillAmount,
            MarketOperation.Sell,
            slippageBufferAmount,
        );
    },
    findOrdersThatCoverMakerAssetFillAmount(
        sortedOrders: SignedOrder[],
        makerAssetFillAmount: BigNumber,
        slippageBufferAmount: BigNumber = new BigNumber(0),
    ): { resultOrders: SignedOrder[]; remainingFillAmount: BigNumber } {
        return findOrdersThatCoverAssetFillAmount(
            sortedOrders,
            makerAssetFillAmount,
            MarketOperation.Buy,
            slippageBufferAmount,
        );
    },
    getAssetAmountAvailable(order: SignedOrderWithFillableAmounts, operation: MarketOperation): BigNumber {
        if (operation === MarketOperation.Buy) {
            if (utils.isOrderTakerFeePayableWithMakerAsset(order)) {
                return order.fillableMakerAssetAmount.minus(order.fillableTakerFeeAmount);
            } else {
                return order.fillableMakerAssetAmount;
            }
        } else {
            if (utils.isOrderTakerFeePayableWithTakerAsset(order)) {
                return order.fillableTakerAssetAmount.plus(order.fillableTakerFeeAmount);
            } else {
                return order.fillableTakerAssetAmount;
            }
        }
    },
};

function findOrdersThatCoverAssetFillAmount(
    sortedOrders: SignedOrder[],
    assetFillAmount: BigNumber,
    operation: MarketOperation,
    slippageBufferAmount: BigNumber,
): { resultOrders: SignedOrder[]; remainingFillAmount: BigNumber } {
    assert.isValidBaseUnitAmount('slippageBufferAmount', slippageBufferAmount);
    // calculate total amount of asset needed to be filled
    const totalFillAmount = assetFillAmount.plus(slippageBufferAmount)
    ;
    const result = _.reduce(
        sortedOrders,
        ({ resultOrders, remainingFillAmount }, order) => {
            if (remainingFillAmount.isLessThanOrEqualTo(constants.ZERO_AMOUNT)) {
                return {
                    resultOrders,
                    remainingFillAmount: constants.ZERO_AMOUNT,
                };
            } else {
                const assetAmountAvailable = operation === MarketOperation.Buy ? order.makerAssetAmount : order.takerAssetAmount;
                const shouldIncludeOrder = assetAmountAvailable.gt(constants.ZERO_AMOUNT);
                // if there is no assetAmountAvailable do not append order to resultOrders
                // if we have exceeded the total amount we want to fill set remainingFillAmount to 0
                return {
                    resultOrders: shouldIncludeOrder ? _.concat(resultOrders, order) : resultOrders,
                    remainingFillAmount: BigNumber.max(
                        constants.ZERO_AMOUNT,
                        remainingFillAmount.minus(assetAmountAvailable),
                    ),
                };
            }
        },
        {
            resultOrders: [] as SignedOrder[],
            remainingFillAmount: totalFillAmount,
        },
    );

    return result;
}
