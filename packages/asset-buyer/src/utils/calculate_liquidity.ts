import { BigNumber } from '@0x/utils';

import { LiquidityForAssetData, OrdersAndFillableAmounts } from '../types';

import { orderUtils } from './order_utils';

export const calculateLiquidity = (ordersAndFillableAmounts: OrdersAndFillableAmounts): LiquidityForAssetData => {
    const { orders, remainingFillableMakerAssetAmounts } = ordersAndFillableAmounts;
    const liquidityInBigNumbers = orders.reduce(
        (acc, order, curIndex) => {
            const availableMakerAssetAmount = remainingFillableMakerAssetAmounts[curIndex];
            if (availableMakerAssetAmount === undefined) {
                throw new Error(`No corresponding fillableMakerAssetAmounts at index ${curIndex}`);
            }

            const tokensAvailableForCurrentOrder = availableMakerAssetAmount;
            const ethValueAvailableForCurrentOrder = orderUtils.getTakerFillAmount(order, availableMakerAssetAmount);
            return {
                tokensAvailableInBaseUnits: acc.tokensAvailableInBaseUnits.plus(tokensAvailableForCurrentOrder),
                ethValueAvailableInWei: acc.ethValueAvailableInWei.plus(ethValueAvailableForCurrentOrder),
            };
        },
        {
            tokensAvailableInBaseUnits: new BigNumber(0),
            ethValueAvailableInWei: new BigNumber(0),
        },
    );

    // Turn into regular numbers
    return {
        tokensAvailableInBaseUnits: liquidityInBigNumbers.tokensAvailableInBaseUnits,
        ethValueAvailableInWei: liquidityInBigNumbers.ethValueAvailableInWei,
    };
};
