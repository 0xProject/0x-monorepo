import { BigNumber } from '@0x/utils';

import { LiquidityForTakerMakerAssetDataPair, PrunedSignedOrder } from '../types';

import { utils } from './utils';

export const calculateLiquidity = (prunedOrders: PrunedSignedOrder[]): LiquidityForTakerMakerAssetDataPair => {
    const liquidityInBigNumbers = prunedOrders.reduce(
        (acc, order) => {
            const fillableMakerAssetAmount = utils.isOrderTakerFeePayableWithMakerAsset(order)
                ? order.fillableMakerAssetAmount.minus(order.fillableTakerFeeAmount)
                : order.fillableMakerAssetAmount;
            const fillableTakerAssetAmount = utils.isOrderTakerFeePayableWithTakerAsset(order)
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
