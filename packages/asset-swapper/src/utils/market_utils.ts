import { schemas } from '@0x/json-schemas';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    MarketOperation,
    PrunedSignedOrder,
} from '../types';

import { assert } from './assert';

export const marketUtils = {
    findOrdersThatCoverTakerAssetSellAmount(
        orders: PrunedSignedOrder[],
        takerAssetSellAmount: BigNumber,
        slippageBufferAmount: BigNumber = new BigNumber(0),
    ): { resultOrders: PrunedSignedOrder[]; remainingFillAmount: BigNumber } {
        return findOrdersThatCoverAssetFillAmount(
            orders,
            takerAssetSellAmount,
            MarketOperation.Sell,
            slippageBufferAmount,
        );
    },
    /**
     * Takes an array of orders and returns a subset of those orders that has enough makerAssetAmount
     * in order to fill the input makerAssetFillAmount plus slippageBufferAmount. Iterates from first order to last order.
     * Sort the input by ascending rate in order to get the subset of orders that will cost the least ETH.
     * @param   orders                      An array of objects that extend the Order interface. All orders should specify the same makerAsset.
     *                                      All orders should specify WETH as the takerAsset.
     * @param   makerAssetFillAmount        The amount of makerAsset desired to be filled.
     * @param   opts                        Optional arguments this function accepts.
     * @return  Resulting orders and remaining fill amount that could not be covered by the input.
     */
    findOrdersThatCoverMakerAssetBuyAmount(
        orders: PrunedSignedOrder[],
        makerAssetBuyAmount: BigNumber,
        slippageBufferAmount: BigNumber = new BigNumber(0),
    ): { resultOrders: PrunedSignedOrder[]; remainingFillAmount: BigNumber } {
        return findOrdersThatCoverAssetFillAmount(
            orders,
            makerAssetBuyAmount,
            MarketOperation.Buy,
            slippageBufferAmount,
        );
    },
};

function findOrdersThatCoverAssetFillAmount(
    orders: PrunedSignedOrder[],
    assetFillAmount: BigNumber,
    operation: MarketOperation,
    slippageBufferAmount: BigNumber,
    ): { resultOrders: PrunedSignedOrder[]; remainingFillAmount: BigNumber } {
    assert.isValidBaseUnitAmount('slippageBufferAmount', slippageBufferAmount);
    // calculate total amount of asset needed to be filled
    const totalFillAmount = assetFillAmount.plus(slippageBufferAmount);
    // iterate through the orders input from left to right until we have enough makerAsset to fill totalFillAmount
    const result = _.reduce(
        orders,
        ({ resultOrders, remainingFillAmount }, order) => {
            if (remainingFillAmount.isLessThanOrEqualTo(constants.ZERO_AMOUNT)) {
                return {
                    resultOrders,
                    remainingFillAmount: constants.ZERO_AMOUNT,
                };
            } else {
                const assetAmountAvailable = operation === MarketOperation.Buy ? order.remainingMakerAssetAmount.minus(order.remainingTakerFee) : order.remainingTakerAssetAmount;
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
