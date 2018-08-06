import { schemas } from '@0xproject/json-schemas';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { assert } from './assert';
import { constants } from './constants';

export const marketUtils = {
    /**
     * Takes an array of orders and returns a subset of those orders that has enough makerAssetAmount (taking into account on-chain balances,
     * allowances, and partial fills) in order to fill the input makerAssetFillAmount plus slippageBufferAmount. Iterates from first order to last.
     * Sort the input by ascending rate in order to get the subset of orders that will cost the least ETH.
     * @param   signedOrders                        An array of objects that conform to the SignedOrder interface. All orders should specify the same makerAsset.
     *                                              All orders should specify WETH as the takerAsset.
     * @param   remainingFillableMakerAssetAmounts  An array of BigNumbers corresponding to the signedOrders parameter.
     *                                              You can use OrderStateUtils @0xproject/order-utils to perform blockchain lookups
     *                                              for these values.
     * @param   makerAssetFillAmount                The amount of makerAsset desired to be filled.
     * @param   slippageBufferAmount                An additional amount of makerAsset to be covered by the result in case of trade collisions or partial fills.
     * @return  Resulting orders and remaining fill amount that could not be covered by the input.
     */
    findOrdersThatCoverMakerAssetFillAmount(
        signedOrders: SignedOrder[],
        remainingFillableMakerAssetAmounts: BigNumber[],
        makerAssetFillAmount: BigNumber,
        slippageBufferAmount: BigNumber = constants.ZERO_AMOUNT,
    ): { resultOrders: SignedOrder[]; remainingFillAmount: BigNumber } {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        _.forEach(remainingFillableMakerAssetAmounts, (amount, index) =>
            assert.isValidBaseUnitAmount(`remainingFillableMakerAssetAmount[${index}]`, amount),
        );
        assert.isValidBaseUnitAmount('makerAssetFillAmount', makerAssetFillAmount);
        assert.isValidBaseUnitAmount('slippageBufferAmount', slippageBufferAmount);
        assert.assert(
            signedOrders.length === remainingFillableMakerAssetAmounts.length,
            'Expected signedOrders.length to equal remainingFillableMakerAssetAmounts.length',
        );
        // calculate total amount of makerAsset needed to be filled
        const totalFillAmount = makerAssetFillAmount.plus(slippageBufferAmount);
        // iterate through the signedOrders input from left to right until we have enough makerAsset to fill totalFillAmount
        const result = _.reduce(
            signedOrders,
            ({ resultOrders, remainingFillAmount }, order, index) => {
                if (remainingFillAmount.lessThanOrEqualTo(constants.ZERO_AMOUNT)) {
                    return { resultOrders, remainingFillAmount: constants.ZERO_AMOUNT };
                } else {
                    const makerAssetAmountAvailable = remainingFillableMakerAssetAmounts[index];
                    // if there is no makerAssetAmountAvailable do not append order to resultOrders
                    // if we have exceeded the total amount we want to fill set remainingFillAmount to 0
                    return {
                        resultOrders: makerAssetAmountAvailable.gt(constants.ZERO_AMOUNT)
                            ? _.concat(resultOrders, order)
                            : resultOrders,
                        remainingFillAmount: BigNumber.max(
                            constants.ZERO_AMOUNT,
                            remainingFillAmount.minus(makerAssetAmountAvailable),
                        ),
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
     * @param   signedOrders                        An array of objects that conform to the SignedOrder interface. All orders should specify ZRX as
     *                                              the makerAsset and WETH as the takerAsset.
     * @param   remainingFillableMakerAssetAmounts  An array of BigNumbers corresponding to the signedOrders parameter.
     *                                              You can use OrderStateUtils @0xproject/order-utils to perform blockchain lookups
     *                                              for these values.
     * @param   signedFeeOrders                     An array of objects that conform to the SignedOrder interface. All orders should specify ZRX as
     *                                              the makerAsset and WETH as the takerAsset.
     * @param   remainingFillableFeeAmounts         An array of BigNumbers corresponding to the signedFeeOrders parameter.
     *                                              You can use OrderStateUtils @0xproject/order-utils to perform blockchain lookups
     *                                              for these values.
     * @param   slippageBufferAmount                An additional amount of fee to be covered by the result in case of trade collisions or partial fills.
     * @return  Resulting orders and remaining fee amount that could not be covered by the input.
     */
    findFeeOrdersThatCoverFeesForTargetOrders(
        signedOrders: SignedOrder[],
        remainingFillableMakerAssetAmounts: BigNumber[],
        signedFeeOrders: SignedOrder[],
        remainingFillableFeeAmounts: BigNumber[],
        slippageBufferAmount: BigNumber = constants.ZERO_AMOUNT,
    ): { resultOrders: SignedOrder[]; remainingFeeAmount: BigNumber } {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        _.forEach(remainingFillableMakerAssetAmounts, (amount, index) =>
            assert.isValidBaseUnitAmount(`remainingFillableMakerAssetAmount[${index}]`, amount),
        );
        assert.doesConformToSchema('signedFeeOrders', signedFeeOrders, schemas.signedOrdersSchema);
        _.forEach(remainingFillableFeeAmounts, (amount, index) =>
            assert.isValidBaseUnitAmount(`remainingFillableFeeAmounts[${index}]`, amount),
        );
        assert.isValidBaseUnitAmount('slippageBufferAmount', slippageBufferAmount);
        assert.assert(
            signedOrders.length === remainingFillableMakerAssetAmounts.length,
            'Expected signedOrders.length to equal remainingFillableMakerAssetAmounts.length',
        );
        assert.assert(
            signedOrders.length === remainingFillableMakerAssetAmounts.length,
            'Expected signedFeeOrders.length to equal remainingFillableFeeAmounts.length',
        );
        // calculate total amount of ZRX needed to fill signedOrders
        const totalFeeAmount = _.reduce(
            signedOrders,
            (accFees, order, index) => {
                const makerAssetAmountAvailable = remainingFillableMakerAssetAmounts[index];
                const feeToFillMakerAssetAmountAvailable = makerAssetAmountAvailable
                    .mul(order.takerFee)
                    .div(order.makerAssetAmount);
                return accFees.plus(feeToFillMakerAssetAmountAvailable);
            },
            constants.ZERO_AMOUNT,
        );
        const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
            signedFeeOrders,
            remainingFillableFeeAmounts,
            totalFeeAmount,
            slippageBufferAmount,
        );
        return {
            resultOrders,
            remainingFeeAmount: remainingFillAmount,
        };
        // TODO: add more orders here to cover rounding
        // https://github.com/0xProject/0x-protocol-specification/blob/master/v2/forwarding-contract-specification.md#over-buying-zrx
    },
};
