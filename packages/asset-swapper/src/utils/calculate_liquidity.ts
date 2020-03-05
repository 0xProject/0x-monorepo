import { BigNumber } from '@0x/utils';

import { LiquidityForTakerMakerAssetDataPair, SignedOrderWithFillableAmounts } from '../types';

import { isOrderTakerFeePayableWithMakerAsset, isOrderTakerFeePayableWithTakerAsset } from './utils';

export const calculateLiquidity = (
    prunedOrders: SignedOrderWithFillableAmounts[],
): LiquidityForTakerMakerAssetDataPair => {
    const liquidityInBigNumbers = prunedOrders.reduce(
        (acc, order) => {
            const fillableMakerAssetAmount = isOrderTakerFeePayableWithMakerAsset(order)
                ? order.fillableMakerAssetAmount.minus(order.fillableTakerFeeAmount)
                : order.fillableMakerAssetAmount;
            const fillableTakerAssetAmount = isOrderTakerFeePayableWithTakerAsset(order)
                ? order.fillableTakerAssetAmount.plus(order.fillableTakerFeeAmount)
                : order.fillableTakerAssetAmount;
            return {
                makerAssetAvailableInBaseUnits: acc.makerAssetAvailableInBaseUnits.plus(fillableMakerAssetAmount),
                takerAssetAvailableInBaseUnits: acc.takerAssetAvailableInBaseUnits.plus(fillableTakerAssetAmount),
            };
        },
        {
            makerAssetAvailableInBaseUnits: new BigNumber(0),
            takerAssetAvailableInBaseUnits: new BigNumber(0),
        },
    );
    return liquidityInBigNumbers;
};
