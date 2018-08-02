import { schemas } from '@0xproject/json-schemas';
import { OrderRelevantState, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { assert } from './assert';
import { constants } from './constants';

export const marketUtils = {
    /**
     * Takes an array of orders and returns a subset of those orders that has enough makerAssetAmount (taking into account on-chain balances,
     * allowances, and partial fills) in order to fill the input makerAssetFillAmount plus slippageBufferAmount. Iterates from first order to last.
     * Sort the input by ascending rate in order to get the subset of orders that will cost the least ETH.
     * @param   signedOrders         An array of objects that conform to the SignedOrder interface. All orders should specify the same makerAsset.
     *                               All orders should specify WETH as the takerAsset.
     * @param   orderStates          An array of objects corresponding to the signedOrders parameter that each contain on-chain state
     *                               relevant to that order.
     * @param   makerAssetFillAmount The amount of makerAsset desired to be filled.
     * @param   slippageBufferAmount An additional amount makerAsset to be covered by the result in case of trade collisions or partial fills.
     * @return  Resulting orders and remaining fill amount that could not be covered by the input.
     */
    findOrdersThatCoverMakerAssetFillAmount(
        signedOrders: SignedOrder[],
        orderStates: OrderRelevantState[],
        makerAssetFillAmount: BigNumber,
        slippageBufferAmount: BigNumber = constants.ZERO_AMOUNT,
    ): { resultOrders: SignedOrder[]; remainingFillAmount: BigNumber } {
        // type assertions
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
        assert.isBigNumber('slippageBufferAmount', slippageBufferAmount);
        // calculate total amount of makerAsset needed to be filled
        const totalFillAmount = makerAssetFillAmount.plus(slippageBufferAmount);
        // iterate through the signedOrders input from left to right until we have enough makerAsset to fill totalFillAmount
        const result = _.reduce(
            signedOrders,
            ({ resultOrders, remainingFillAmount }, order, index) => {
                if (remainingFillAmount.lessThanOrEqualTo(constants.ZERO_AMOUNT)) {
                    return { resultOrders, remainingFillAmount: constants.ZERO_AMOUNT };
                } else {
                    const orderState = orderStates[index];
                    const makerAssetAmountAvailable = getMakerAssetAmountAvailable(orderState);
                    return {
                        resultOrders: _.concat(resultOrders, order),
                        remainingFillAmount: remainingFillAmount.minus(makerAssetAmountAvailable),
                    };
                }
            },
            { resultOrders: [] as SignedOrder[], remainingFillAmount: totalFillAmount },
        );
        return result;
    },
    /**
     * Takes an array of orders and an array of feeOrders. Returns a subset of the feeOrders that has enough ZRX (taking into account
     * on-chain balances, allowances, and partial fills) in order to fill the takerFees required by signedOrders plus a
     * slippageBufferAmount. Iterates from first feeOrder to last. Sort the feeOrders by ascending rate in order to get the subset of
     * feeOrders that will cost the least ETH.
     * @param   signedOrders         An array of objects that conform to the SignedOrder interface. All orders should specify ZRX as
     *                               the makerAsset and WETH as the takerAsset.
     * @param   orderStates          An array of objects corresponding to the signedOrders parameter that each contain on-chain state
     *                               relevant to that order.
     * @param   signedFeeOrders      An array of objects that conform to the SignedOrder interface. All orders should specify ZRX as
     *                               the makerAsset and WETH as the takerAsset.
     * @param   feeOrderStates       An array of objects corresponding to the signedOrders parameter that each contain on-chain state
     *                               relevant to that order.
     * @param   makerAssetFillAmount The amount of makerAsset desired to be filled.
     * @param   slippageBufferAmount An additional amount makerAsset to be covered by the result in case of trade collisions or partial fills.
     * @return  Resulting orders and remaining fill amount that could not be covered by the input.
     */
    findFeeOrdersThatCoverFeesForTargetOrders(
        signedOrders: SignedOrder[],
        orderStates: OrderRelevantState[],
        signedFeeOrders: SignedOrder[],
        feeOrderStates: OrderRelevantState[],
        slippageBufferAmount: BigNumber = constants.ZERO_AMOUNT,
    ): { resultOrders: SignedOrder[]; remainingFillAmount: BigNumber } {
        // type assertions
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.doesConformToSchema('signedFeeOrders', signedFeeOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('slippageBufferAmount', slippageBufferAmount);
        // calculate total amount of ZRX needed to fill signedOrders
        const totalFeeAmount = _.reduce(
            signedOrders,
            (accFees, order, index) => {
                const orderState = orderStates[index];
                const makerAssetAmountAvailable = getMakerAssetAmountAvailable(orderState);
                const feeToFillMakerAssetAmountAvailable = makerAssetAmountAvailable
                    .div(order.makerAssetAmount)
                    .mul(order.takerFee);
                return accFees.plus(feeToFillMakerAssetAmountAvailable);
            },
            constants.ZERO_AMOUNT,
        );
        return marketUtils.findOrdersThatCoverMakerAssetFillAmount(
            signedFeeOrders,
            feeOrderStates,
            totalFeeAmount,
            slippageBufferAmount,
        );
    },
};

const getMakerAssetAmountAvailable = (orderState: OrderRelevantState) => {
    return BigNumber.min(
        orderState.makerBalance,
        orderState.remainingFillableMakerAssetAmount,
        orderState.makerProxyAllowance,
    );
};
