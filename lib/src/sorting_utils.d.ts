import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
export declare const sortingUtils: {
    /**
     * Takes an array of orders and sorts them by takerAsset/makerAsset rate in ascending order (best rate first).
     * Adjusts the rate of each order according to the feeRate and takerFee for that order.
     * @param   orders      An array of objects that extend the Order interface. All orders should specify ZRX as
     *                      the makerAsset and WETH as the takerAsset.
     * @param   feeRate     The market rate of ZRX denominated in takerAssetAmount
     *                      (ex. feeRate is 0.1 takerAsset/ZRX if it takes 1 unit of takerAsset to buy 10 ZRX)
     *                      Defaults to 0
     * @return  The input orders sorted by rate in ascending order
     */
    sortOrdersByFeeAdjustedRate<T extends Order>(orders: T[], feeRate?: BigNumber): T[];
    /**
     * Takes an array of fee orders (makerAssetData corresponds to ZRX and takerAssetData corresponds to WETH)
     * and sorts them by rate in ascending order (best rate first). Adjusts the rate according to the takerFee.
     * @param   feeOrders       An array of objects that extend the Order interface. All orders should specify ZRX as
     *                          the makerAsset and WETH as the takerAsset.
     * @return  The input orders sorted by rate in ascending order
     */
    sortFeeOrdersByFeeAdjustedRate<T extends Order>(feeOrders: T[]): T[];
};
//# sourceMappingURL=sorting_utils.d.ts.map