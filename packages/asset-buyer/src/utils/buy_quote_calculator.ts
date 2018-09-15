import { marketUtils } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';

import { constants } from '../constants';
import { AssetBuyerError, AssetBuyerOrdersAndFillableAmounts, BuyQuote } from '../types';

export const buyQuoteCalculator = {
    calculate(
        ordersAndFillableAmounts: AssetBuyerOrdersAndFillableAmounts,
        assetBuyAmount: BigNumber,
        feePercentage: number,
        slippagePercentage: number,
    ): BuyQuote {
        const {
            orders,
            feeOrders,
            remainingFillableMakerAssetAmounts,
            remainingFillableFeeAmounts,
        } = ordersAndFillableAmounts;
        const slippageBufferAmount = assetBuyAmount.mul(slippagePercentage).round();
        const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
            orders,
            assetBuyAmount,
            {
                remainingFillableMakerAssetAmounts,
                slippageBufferAmount,
            },
        );
        if (remainingFillAmount.gt(constants.ZERO_AMOUNT)) {
            throw new Error(AssetBuyerError.InsufficientAssetLiquidity);
        }
        // TODO: optimization
        // update this logic to find the minimum amount of feeOrders to cover the worst case as opposed to
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
            throw new Error(AssetBuyerError.InsufficientZrxLiquidity);
        }
        const assetData = orders[0].makerAssetData;
        // TODO: critical
        // calculate minRate and maxRate by calculating min and max eth usage and then dividing into
        // assetBuyAmount to get assetData / WETH, needs to take into account feePercentage as well
        return {
            assetData,
            orders: resultOrders,
            feeOrders: resultFeeOrders,
            minRate: constants.ZERO_AMOUNT,
            maxRate: constants.ZERO_AMOUNT,
            assetBuyAmount,
            feePercentage,
        };
    },
};
