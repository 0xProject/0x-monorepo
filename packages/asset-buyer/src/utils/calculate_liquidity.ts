import { orderCalculationUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';

import { LiquidityForAssetData, OrdersAndFillableAmounts } from '../types';

export const calculateLiquidity = (ordersAndFillableAmounts: OrdersAndFillableAmounts): LiquidityForAssetData => {
    const { orders, remainingFillableMakerAssetAmounts } = ordersAndFillableAmounts;
    const liquidityInBigNumbers = orders.reduce(
        (acc, order, curIndex) => {
            const availableMakerAssetAmount = remainingFillableMakerAssetAmounts[curIndex];
            if (availableMakerAssetAmount === undefined) {
                throw new Error(`No corresponding fillableMakerAssetAmounts at index ${curIndex}`);
            }

            const makerTokensAvailableForCurrentOrder = availableMakerAssetAmount;
            const takerTokensAvailableForCurrentOrder = orderCalculationUtils.getTakerFillAmount(
                order,
                makerTokensAvailableForCurrentOrder,
            );
            return {
                makerTokensAvailableInBaseUnits: acc.makerTokensAvailableInBaseUnits.plus(
                    makerTokensAvailableForCurrentOrder,
                ),
                takerTokensAvailableInBaseUnits: acc.takerTokensAvailableInBaseUnits.plus(
                    takerTokensAvailableForCurrentOrder,
                ),
            };
        },
        {
            makerTokensAvailableInBaseUnits: new BigNumber(0),
            takerTokensAvailableInBaseUnits: new BigNumber(0),
        },
    );

    // Turn into regular numbers
    return {
        makerTokensAvailableInBaseUnits: liquidityInBigNumbers.makerTokensAvailableInBaseUnits,
        takerTokensAvailableInBaseUnits: liquidityInBigNumbers.takerTokensAvailableInBaseUnits,
    };
};
