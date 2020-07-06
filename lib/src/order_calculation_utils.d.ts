import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
export declare const orderCalculationUtils: {
    /**
     * Determines if the order is expired given the current time
     * @param order The order for expiry calculation
     */
    isOrderExpired(order: Order): boolean;
    /**
     * Calculates if the order will expire in the future.
     * @param order The order for expiry calculation
     * @param secondsFromNow The amount of seconds from current time
     */
    willOrderExpire(order: Order, secondsFromNow: number): boolean;
    /**
     * Determines if the order is open and fillable by any taker.
     * @param order The order
     */
    isOpenOrder(order: Order): boolean;
    /**
     * Given an amount of taker asset, calculate the the amount of maker asset
     * @param order The order
     * @param makerFillAmount the amount of taker asset
     */
    getMakerFillAmount(order: Order, takerFillAmount: BigNumber): BigNumber;
    /**
     * Given an amount of maker asset, calculate the equivalent amount in taker asset
     * @param order The order
     * @param makerFillAmount the amount of maker asset
     */
    getTakerFillAmount(order: Order, makerFillAmount: BigNumber): BigNumber;
    /**
     * Given an amount of taker asset, calculate the fee amount required for the taker
     * @param order The order
     * @param takerFillAmount the amount of taker asset
     */
    getTakerFeeAmount(order: Order, takerFillAmount: BigNumber): BigNumber;
    /**
     * Given an amount of maker asset, calculate the fee amount required for the maker
     * @param order The order
     * @param makerFillAmount the amount of maker asset
     */
    getMakerFeeAmount(order: Order, makerFillAmount: BigNumber): BigNumber;
    /**
     * Given a desired amount of ZRX from a fee order, calculate the amount of taker asset required to fill.
     * Also calculate how much ZRX needs to be purchased in order to fill the desired amount plus the taker fee amount
     * @param order The order
     * @param makerFillAmount the amount of maker asset
     */
    getTakerFillAmountForFeeOrder(order: Order, makerFillAmount: BigNumber): [BigNumber, BigNumber];
};
//# sourceMappingURL=order_calculation_utils.d.ts.map