import { marketUtils } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import { orderUtils } from './order_utils';
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
        const {
            resultOrders,
            remainingFillAmount,
            ordersRemainingFillableMakerAssetAmounts,
        } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(orders, assetBuyAmount, {
            remainingFillableMakerAssetAmounts,
            slippageBufferAmount,
        });
        if (remainingFillAmount.gt(constants.ZERO_AMOUNT)) {
            throw new Error(AssetBuyerError.InsufficientAssetLiquidity);
        }
        // TODO(bmillman): optimization
        // update this logic to find the minimum amount of feeOrders to cover the worst case as opposed to
        // finding order that cover all fees, this will help with estimating ETH and minimizing gas usage
        const {
            resultFeeOrders,
            remainingFeeAmount,
            feeOrdersRemainingFillableMakerAssetAmounts,
        } = marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(resultOrders, feeOrders, {
            remainingFillableMakerAssetAmounts,
            remainingFillableFeeAmounts,
        });
        if (remainingFeeAmount.gt(constants.ZERO_AMOUNT)) {
            throw new Error(AssetBuyerError.InsufficientZrxLiquidity);
        }
        const assetData = orders[0].makerAssetData;

        // calculate minRate and maxRate by calculating min and max eth usage and then dividing into
        // assetBuyAmount to get assetData / WETH, needs to take into account feePercentage as well
        // minEthAmount = (sum(takerAssetAmount[i]) until sum(makerAssetAmount[i]) >= assetBuyAmount ) * (1 + feePercentage)
        // maxEthAmount = (sum(takerAssetAmount[i]) until i == orders.length) * (1 + feePercentage)
        const allOrders = _.concat(resultOrders, resultFeeOrders);
        const allRemainingAmounts = _.concat(
            ordersRemainingFillableMakerAssetAmounts,
            feeOrdersRemainingFillableMakerAssetAmounts,
        );
        let minEthAmount = constants.ZERO_AMOUNT;
        let maxEthAmount = constants.ZERO_AMOUNT;
        let cumulativeMakerAmount = constants.ZERO_AMOUNT;
        _.forEach(allOrders, (order, index) => {
            const remainingFillableMakerAssetAmount = allRemainingAmounts[index];
            const claimableTakerAssetAmount = orderUtils.calculateRemainingTakerAssetAmount(
                order,
                remainingFillableMakerAssetAmount,
            );
            // taker asset is always assumed to be WETH
            maxEthAmount = maxEthAmount.plus(claimableTakerAssetAmount);
            if (cumulativeMakerAmount.lessThan(assetBuyAmount)) {
                minEthAmount = minEthAmount.plus(claimableTakerAssetAmount);
            }
            cumulativeMakerAmount = cumulativeMakerAmount.plus(remainingFillableMakerAssetAmount);
        });
        const feeAdjustedMinRate = minEthAmount.mul(feePercentage + 1).div(assetBuyAmount);
        const feeAdjustedMaxRate = minEthAmount.mul(feePercentage + 1).div(assetBuyAmount);
        return {
            assetData,
            orders: resultOrders,
            feeOrders: resultFeeOrders,
            minRate: feeAdjustedMinRate,
            maxRate: feeAdjustedMaxRate,
            assetBuyAmount,
            feePercentage,
        };
    },
};
