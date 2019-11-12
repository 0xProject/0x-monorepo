import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import { MarketOperation, PrunedSignedOrder } from '../types';

import { assert } from './assert';
import { utils } from './utils';

export const marketUtils = {
    findOrdersThatCoverTakerAssetFillAmount(
        sortedOrders: PrunedSignedOrder[],
        takerAssetFillAmount: BigNumber,
        slippageBufferAmount: BigNumber = new BigNumber(0),
    ): { resultOrders: PrunedSignedOrder[]; remainingFillAmount: BigNumber } {
        return findOrdersThatCoverAssetFillAmount(
            sortedOrders,
            takerAssetFillAmount,
            MarketOperation.Sell,
            slippageBufferAmount,
        );
    },
    findOrdersThatCoverMakerAssetFillAmount(
        sortedOrders: PrunedSignedOrder[],
        makerAssetFillAmount: BigNumber,
        slippageBufferAmount: BigNumber = new BigNumber(0),
    ): { resultOrders: PrunedSignedOrder[]; remainingFillAmount: BigNumber } {
        return findOrdersThatCoverAssetFillAmount(
            sortedOrders,
            makerAssetFillAmount,
            MarketOperation.Buy,
            slippageBufferAmount,
        );
    },
};

function findOrdersThatCoverAssetFillAmount(
    sortedOrders: PrunedSignedOrder[],
    assetFillAmount: BigNumber,
    operation: MarketOperation,
    slippageBufferAmount: BigNumber,
): { resultOrders: PrunedSignedOrder[]; remainingFillAmount: BigNumber } {
    assert.isValidBaseUnitAmount('slippageBufferAmount', slippageBufferAmount);
    // calculate total amount of asset needed to be filled
    const totalFillAmount = assetFillAmount.plus(slippageBufferAmount);
    // iterate through the orders input from left to right until we have enough makerAsset to fill totalFillAmount
    const result = _.reduce(
        sortedOrders,
        ({ resultOrders, remainingFillAmount }, order) => {
            if (remainingFillAmount.isLessThanOrEqualTo(constants.ZERO_AMOUNT)) {
                return {
                    resultOrders,
                    remainingFillAmount: constants.ZERO_AMOUNT,
                };
            } else {
                const assetAmountAvailable = getAssetAmountAvailable(order, operation);
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
            resultOrders: [] as PrunedSignedOrder[],
            remainingFillAmount: totalFillAmount,
        },
    );

    return result;
}

function getAssetAmountAvailable(order: PrunedSignedOrder, operation: MarketOperation): BigNumber {
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
}
