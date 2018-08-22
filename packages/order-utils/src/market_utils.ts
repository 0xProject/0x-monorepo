import { schemas } from '@0xproject/json-schemas';
import { Order } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { assert } from './assert';
import { constants } from './constants';
import { FindFeeOrdersThatCoverFeesForTargetOrdersOpts, FindOrdersThatCoverMakerAssetFillAmountOpts } from './types';

export const marketUtils = {
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
    findOrdersThatCoverMakerAssetFillAmount<T extends Order>(
        orders: T[],
        makerAssetFillAmount: BigNumber,
        opts?: FindOrdersThatCoverMakerAssetFillAmountOpts,
    ): { resultOrders: T[]; remainingFillAmount: BigNumber } {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        assert.isValidBaseUnitAmount('makerAssetFillAmount', makerAssetFillAmount);
        // try to get remainingFillableMakerAssetAmounts from opts, if it's not there, use makerAssetAmount values from orders
        const remainingFillableMakerAssetAmounts = _.get(
            opts,
            'remainingFillableMakerAssetAmounts',
            _.map(orders, order => order.makerAssetAmount),
        ) as BigNumber[];
        _.forEach(remainingFillableMakerAssetAmounts, (amount, index) =>
            assert.isValidBaseUnitAmount(`remainingFillableMakerAssetAmount[${index}]`, amount),
        );
        assert.assert(
            orders.length === remainingFillableMakerAssetAmounts.length,
            'Expected orders.length to equal opts.remainingFillableMakerAssetAmounts.length',
        );
        // try to get slippageBufferAmount from opts, if it's not there, default to 0
        const slippageBufferAmount = _.get(opts, 'slippageBufferAmount', constants.ZERO_AMOUNT) as BigNumber;
        assert.isValidBaseUnitAmount('opts.slippageBufferAmount', slippageBufferAmount);
        // calculate total amount of makerAsset needed to be filled
        const totalFillAmount = makerAssetFillAmount.plus(slippageBufferAmount);
        // iterate through the orders input from left to right until we have enough makerAsset to fill totalFillAmount
        const result = _.reduce(
            orders,
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
            { resultOrders: [] as T[], remainingFillAmount: totalFillAmount },
        );
        return result;
    },
    /**
     * Takes an array of orders and an array of feeOrders. Returns a subset of the feeOrders that has enough ZRX
     * in order to fill the takerFees required by orders plus a slippageBufferAmount.
     * Iterates from first feeOrder to last. Sort the feeOrders by ascending rate in order to get the subset of
     * feeOrders that will cost the least ETH.
     * @param   orders      An array of objects that extend the Order interface. All orders should specify ZRX as
     *                      the makerAsset and WETH as the takerAsset.
     * @param   feeOrders   An array of objects that extend the Order interface. All orders should specify ZRX as
     *                      the makerAsset and WETH as the takerAsset.
     * @param   opts        Optional arguments this function accepts.
     * @return  Resulting orders and remaining fee amount that could not be covered by the input.
     */
    findFeeOrdersThatCoverFeesForTargetOrders<T extends Order>(
        orders: T[],
        feeOrders: T[],
        opts?: FindFeeOrdersThatCoverFeesForTargetOrdersOpts,
    ): { resultFeeOrders: T[]; remainingFeeAmount: BigNumber } {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        assert.doesConformToSchema('feeOrders', feeOrders, schemas.ordersSchema);
        // try to get remainingFillableMakerAssetAmounts from opts, if it's not there, use makerAssetAmount values from orders
        const remainingFillableMakerAssetAmounts = _.get(
            opts,
            'remainingFillableMakerAssetAmounts',
            _.map(orders, order => order.makerAssetAmount),
        ) as BigNumber[];
        _.forEach(remainingFillableMakerAssetAmounts, (amount, index) =>
            assert.isValidBaseUnitAmount(`remainingFillableMakerAssetAmount[${index}]`, amount),
        );
        assert.assert(
            orders.length === remainingFillableMakerAssetAmounts.length,
            'Expected orders.length to equal opts.remainingFillableMakerAssetAmounts.length',
        );
        // try to get remainingFillableFeeAmounts from opts, if it's not there, use makerAssetAmount values from feeOrders
        const remainingFillableFeeAmounts = _.get(
            opts,
            'remainingFillableFeeAmounts',
            _.map(feeOrders, order => order.makerAssetAmount),
        ) as BigNumber[];
        _.forEach(remainingFillableFeeAmounts, (amount, index) =>
            assert.isValidBaseUnitAmount(`remainingFillableFeeAmounts[${index}]`, amount),
        );
        assert.assert(
            feeOrders.length === remainingFillableFeeAmounts.length,
            'Expected feeOrders.length to equal opts.remainingFillableFeeAmounts.length',
        );
        // try to get slippageBufferAmount from opts, if it's not there, default to 0
        const slippageBufferAmount = _.get(opts, 'slippageBufferAmount', constants.ZERO_AMOUNT) as BigNumber;
        assert.isValidBaseUnitAmount('opts.slippageBufferAmount', slippageBufferAmount);
        // calculate total amount of ZRX needed to fill orders
        const totalFeeAmount = _.reduce(
            orders,
            (accFees, order, index) => {
                const makerAssetAmountAvailable = remainingFillableMakerAssetAmounts[index];
                const feeToFillMakerAssetAmountAvailable = makerAssetAmountAvailable
                    .mul(order.takerFee)
                    .dividedToIntegerBy(order.makerAssetAmount);
                return accFees.plus(feeToFillMakerAssetAmountAvailable);
            },
            constants.ZERO_AMOUNT,
        );
        const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
            feeOrders,
            totalFeeAmount,
            {
                remainingFillableMakerAssetAmounts: remainingFillableFeeAmounts,
                slippageBufferAmount,
            },
        );
        return {
            resultFeeOrders: resultOrders,
            remainingFeeAmount: remainingFillAmount,
        };
        // TODO: add more orders here to cover rounding
        // https://github.com/0xProject/0x-protocol-specification/blob/master/v2/forwarding-contract-specification.md#over-buying-zrx
    },
};
