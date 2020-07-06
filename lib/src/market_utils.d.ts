import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { FeeOrdersAndRemainingFeeAmount, FindFeeOrdersThatCoverFeesForTargetOrdersOpts, FindOrdersThatCoverMakerAssetFillAmountOpts, FindOrdersThatCoverTakerAssetFillAmountOpts, OrdersAndRemainingMakerFillAmount, OrdersAndRemainingTakerFillAmount } from './types';
export declare const marketUtils: {
    findOrdersThatCoverTakerAssetFillAmount<T extends Order>(orders: T[], takerAssetFillAmount: BigNumber, opts?: FindOrdersThatCoverTakerAssetFillAmountOpts | undefined): OrdersAndRemainingTakerFillAmount<T>;
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
    findOrdersThatCoverMakerAssetFillAmount<T extends Order>(orders: T[], makerAssetFillAmount: BigNumber, opts?: FindOrdersThatCoverMakerAssetFillAmountOpts | undefined): OrdersAndRemainingMakerFillAmount<T>;
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
    findFeeOrdersThatCoverFeesForTargetOrders<T extends Order>(orders: T[], feeOrders: T[], opts?: FindFeeOrdersThatCoverFeesForTargetOrdersOpts | undefined): FeeOrdersAndRemainingFeeAmount<T>;
};
//# sourceMappingURL=market_utils.d.ts.map