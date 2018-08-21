import { marketUtils, sortingUtils } from '@0xproject/order-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { constants } from './constants';
import { ForwarderHelper, ForwarderHelperError, MarketBuyOrdersInfo, MarketBuyOrdersInfoRequest } from './types';

const SLIPPAGE_PERCENTAGE = new BigNumber(0.2); // 20% slippage protection, possibly move this into request interface

interface SignedOrderWithAmount extends SignedOrder {
    remainingFillAmount?: BigNumber;
}

export interface ForwarderHelperImplConfig {
    orders: SignedOrder[];
    feeOrders: SignedOrder[];
    remainingFillableMakerAssetAmounts?: BigNumber[];
    remainingFillableFeeAmounts?: BigNumber[];
}

export class ForwarderHelperImpl implements ForwarderHelper {
    public readonly config: ForwarderHelperImplConfig;
    private static _createSignedOrderWithAmounts(
        orders: SignedOrder[],
        amounts?: BigNumber[],
    ): SignedOrderWithAmount[] {
        const ordersAndAmounts = _.map(orders, (order, index) => {
            return {
                ...order,
                remainingFillAmount: _.nth(amounts, index),
            };
        });
        return ordersAndAmounts;
    }
    private static _unbundleSignedOrderWithAmounts(
        signedOrderWithAmounts: SignedOrderWithAmount[],
    ): { orders: SignedOrder[]; amounts?: BigNumber[] } {
        const orders = _.map(signedOrderWithAmounts, order => {
            const { remainingFillAmount, ...rest } = order;
            return rest;
        });
        const amounts = _.map(signedOrderWithAmounts, order => {
            const { remainingFillAmount, ...rest } = order;
            return remainingFillAmount;
        });
        const compactAmounts = _.compact(amounts);
        return {
            orders,
            amounts: compactAmounts.length > 0 ? compactAmounts : undefined,
        };
    }
    private static _sortConfig(opts: ForwarderHelperImplConfig): ForwarderHelperImplConfig {
        const { orders, feeOrders, remainingFillableMakerAssetAmounts, remainingFillableFeeAmounts } = opts;
        const orderWithAmounts = ForwarderHelperImpl._createSignedOrderWithAmounts(
            orders,
            remainingFillableMakerAssetAmounts,
        );
        // TODO: provide a feeRate to the sorting function to more accurately sort based on the current market for ZRX tokens
        const sortedOrderWithAmounts = sortingUtils.sortOrdersByFeeAdjustedRate(orderWithAmounts);
        const unbundledSortedOrderWithAmounts = ForwarderHelperImpl._unbundleSignedOrderWithAmounts(
            sortedOrderWithAmounts,
        );
        const feeOrderWithAmounts = ForwarderHelperImpl._createSignedOrderWithAmounts(
            feeOrders,
            remainingFillableFeeAmounts,
        );
        const sortedFeeOrderWithAmounts = sortingUtils.sortFeeOrdersByFeeAdjustedRate(feeOrderWithAmounts);
        const unbundledSortedFeeOrderWithAmounts = ForwarderHelperImpl._unbundleSignedOrderWithAmounts(
            sortedFeeOrderWithAmounts,
        );
        return {
            orders: unbundledSortedOrderWithAmounts.orders,
            feeOrders: unbundledSortedFeeOrderWithAmounts.orders,
            remainingFillableMakerAssetAmounts: unbundledSortedOrderWithAmounts.amounts,
            remainingFillableFeeAmounts: unbundledSortedFeeOrderWithAmounts.amounts,
        };
    }
    constructor(opts: ForwarderHelperImplConfig) {
        this.config = ForwarderHelperImpl._sortConfig(opts);
    }
    public getMarketBuyOrdersInfo(request: MarketBuyOrdersInfoRequest): MarketBuyOrdersInfo {
        const { makerAssetFillAmount, feePercentage } = request;
        const { orders, feeOrders, remainingFillableMakerAssetAmounts, remainingFillableFeeAmounts } = this.config;
        // TODO: make the slippage percentage customizable
        const slippageBufferAmount = makerAssetFillAmount.mul(SLIPPAGE_PERCENTAGE);
        const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
            orders,
            makerAssetFillAmount,
            {
                remainingFillableMakerAssetAmounts,
                slippageBufferAmount,
            },
        );
        if (remainingFillAmount.gt(constants.ZERO_AMOUNT)) {
            throw new Error(ForwarderHelperError.InsufficientLiquidity);
        }
        // TODO: update this logic to find the minimum amount of feeOrders to cover the worst case as opposed to
        // finding order that cover all fees, this will help with estimating ETH and minimizing gas usage
        const { resultFeeOrders, remainingFeeAmount } = marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(
            resultOrders,
            feeOrders,
            {
                remainingFillableMakerAssetAmounts,
                remainingFillableFeeAmounts,
            },
        );
        if (remainingFeeAmount.gt(constants.ZERO_AMOUNT)) {
            throw new Error(ForwarderHelperError.InsufficientZrxLiquidity);
        }
        // TODO: calculate min and max eth usage
        // TODO: optimize orders call data
        return {
            makerAssetFillAmount,
            orders: resultOrders,
            feeOrders: resultFeeOrders,
            minEthAmount: constants.ZERO_AMOUNT,
            maxEthAmount: constants.ZERO_AMOUNT,
            feePercentage,
        };
    }
}
