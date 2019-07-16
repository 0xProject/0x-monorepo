import { schemas } from '@0x/json-schemas';
import { MarketOperation, Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { assert } from './assert';
import { constants } from './constants';
import {
    FeeOrdersAndRemainingFeeAmount,
    FindFeeOrdersThatCoverFeesForTargetOrdersOpts,
    FindOrdersThatCoverMakerAssetFillAmountOpts,
    FindOrdersThatCoverTakerAssetFillAmountOpts,
    OrdersAndRemainingMakerFillAmount,
    OrdersAndRemainingTakerFillAmount,
} from './types';

export const marketUtils = {
    findOrdersThatCoverTakerAssetFillAmount<T extends Order>(
        orders: T[],
        takerAssetFillAmount: BigNumber,
        opts?: FindOrdersThatCoverTakerAssetFillAmountOpts,
    ): OrdersAndRemainingTakerFillAmount<T> {
        return findOrdersThatCoverAssetFillAmount<T>(
            orders,
            takerAssetFillAmount,
            MarketOperation.Sell,
            opts,
        ) as OrdersAndRemainingTakerFillAmount<T>;
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
    findOrdersThatCoverMakerAssetFillAmount<T extends Order>(
        orders: T[],
        makerAssetFillAmount: BigNumber,
        opts?: FindOrdersThatCoverMakerAssetFillAmountOpts,
    ): OrdersAndRemainingMakerFillAmount<T> {
        return findOrdersThatCoverAssetFillAmount<T>(
            orders,
            makerAssetFillAmount,
            MarketOperation.Buy,
            opts,
        ) as OrdersAndRemainingMakerFillAmount<T>;
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
    ): FeeOrdersAndRemainingFeeAmount<T> {
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
                    .multipliedBy(order.takerFee)
                    .dividedToIntegerBy(order.makerAssetAmount);
                return accFees.plus(feeToFillMakerAssetAmountAvailable);
            },
            constants.ZERO_AMOUNT,
        );
        const {
            resultOrders,
            remainingFillAmount,
            ordersRemainingFillableMakerAssetAmounts,
        } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(feeOrders, totalFeeAmount, {
            remainingFillableMakerAssetAmounts: remainingFillableFeeAmounts,
            slippageBufferAmount,
        });
        return {
            resultFeeOrders: resultOrders,
            remainingFeeAmount: remainingFillAmount,
            feeOrdersRemainingFillableMakerAssetAmounts: ordersRemainingFillableMakerAssetAmounts,
        };
        // TODO: add more orders here to cover rounding
        // https://github.com/0xProject/0x-protocol-specification/blob/master/v2/forwarding-contract-specification.md#over-buying-zrx
    },
};

function findOrdersThatCoverAssetFillAmount<T extends Order>(
    orders: T[],
    assetFillAmount: BigNumber,
    operation: MarketOperation,
    opts?: FindOrdersThatCoverTakerAssetFillAmountOpts | FindOrdersThatCoverMakerAssetFillAmountOpts,
): OrdersAndRemainingTakerFillAmount<T> | OrdersAndRemainingMakerFillAmount<T> {
    const variablePrefix = operation === MarketOperation.Buy ? 'Maker' : 'Taker';
    assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
    assert.isValidBaseUnitAmount('assetFillAmount', assetFillAmount);
    // try to get remainingFillableTakerAssetAmounts from opts, if it's not there, use takerAssetAmount values from orders
    const remainingFillableAssetAmounts = _.get(
        opts,
        `remainingFillable${variablePrefix}AssetAmounts`,
        _.map(orders, order => (operation === MarketOperation.Buy ? order.makerAssetAmount : order.takerAssetAmount)),
    ) as BigNumber[];
    _.forEach(remainingFillableAssetAmounts, (amount, index) =>
        assert.isValidBaseUnitAmount(`remainingFillable${variablePrefix}AssetAmount[${index}]`, amount),
    );
    assert.assert(
        orders.length === remainingFillableAssetAmounts.length,
        `Expected orders.length to equal opts.remainingFillable${variablePrefix}AssetAmounts.length`,
    );
    // try to get slippageBufferAmount from opts, if it's not there, default to 0
    const slippageBufferAmount = _.get(opts, 'slippageBufferAmount', constants.ZERO_AMOUNT) as BigNumber;
    assert.isValidBaseUnitAmount('opts.slippageBufferAmount', slippageBufferAmount);
    // calculate total amount of asset needed to be filled
    const totalFillAmount = assetFillAmount.plus(slippageBufferAmount);
    // iterate through the orders input from left to right until we have enough makerAsset to fill totalFillAmount
    const result = _.reduce(
        orders,
        ({ resultOrders, remainingFillAmount, ordersRemainingFillableAssetAmounts }, order, index) => {
            if (remainingFillAmount.isLessThanOrEqualTo(constants.ZERO_AMOUNT)) {
                return {
                    resultOrders,
                    remainingFillAmount: constants.ZERO_AMOUNT,
                    ordersRemainingFillableAssetAmounts,
                };
            } else {
                const assetAmountAvailable = remainingFillableAssetAmounts[index];
                const shouldIncludeOrder = assetAmountAvailable.gt(constants.ZERO_AMOUNT);
                // if there is no assetAmountAvailable do not append order to resultOrders
                // if we have exceeded the total amount we want to fill set remainingFillAmount to 0
                return {
                    resultOrders: shouldIncludeOrder ? _.concat(resultOrders, order) : resultOrders,
                    ordersRemainingFillableAssetAmounts: shouldIncludeOrder
                        ? _.concat(ordersRemainingFillableAssetAmounts, assetAmountAvailable)
                        : ordersRemainingFillableAssetAmounts,
                    remainingFillAmount: BigNumber.max(
                        constants.ZERO_AMOUNT,
                        remainingFillAmount.minus(assetAmountAvailable),
                    ),
                };
            }
        },
        {
            resultOrders: [] as T[],
            remainingFillAmount: totalFillAmount,
            ordersRemainingFillableAssetAmounts: [] as BigNumber[],
        },
    );

    const {
        ordersRemainingFillableAssetAmounts: resultOrdersRemainingFillableAssetAmounts,
        // tslint:disable-next-line: trailing-comma
        ...ordersAndRemainingFillAmount
    } = result;

    if (operation === MarketOperation.Buy) {
        return {
            ...ordersAndRemainingFillAmount,
            ordersRemainingFillableMakerAssetAmounts: resultOrdersRemainingFillableAssetAmounts,
        };
    } else {
        return {
            ...ordersAndRemainingFillAmount,
            ordersRemainingFillableTakerAssetAmounts: resultOrdersRemainingFillableAssetAmounts,
        };
    }
}
