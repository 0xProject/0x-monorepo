import { orderCalculationUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';

import { LiquidityForTakerMakerAssetDataPair, PrunedSignedOrder } from '../types';

export const calculateLiquidity = (prunedOrders: PrunedSignedOrder[]): LiquidityForTakerMakerAssetDataPair => {
    const liquidityInBigNumbers = prunedOrders.reduce(
        (acc, order, index) => {
            return {
                makerTokensAvailableInBaseUnits: acc.makerTokensAvailableInBaseUnits.plus(
                    order.remainingMakerAssetAmount.minus(order.remainingTakerFee),
                ),
                takerTokensAvailableInBaseUnits: acc.takerTokensAvailableInBaseUnits.plus(
                    order.remainingTakerAssetAmount,
                ),
            };
        },
        {
            makerTokensAvailableInBaseUnits: new BigNumber(0),
            takerTokensAvailableInBaseUnits: new BigNumber(0),
        },
    );
    return liquidityInBigNumbers;
};
