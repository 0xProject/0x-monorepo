"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
var constants_1 = require("./constants");
exports.orderCalculationUtils = {
    /**
     * Determines if the order is expired given the current time
     * @param order The order for expiry calculation
     */
    isOrderExpired: function (order) {
        return exports.orderCalculationUtils.willOrderExpire(order, 0);
    },
    /**
     * Calculates if the order will expire in the future.
     * @param order The order for expiry calculation
     * @param secondsFromNow The amount of seconds from current time
     */
    willOrderExpire: function (order, secondsFromNow) {
        var millisecondsInSecond = 1000;
        var currentUnixTimestampSec = new utils_1.BigNumber(Date.now() / millisecondsInSecond).integerValue();
        return order.expirationTimeSeconds.isLessThan(currentUnixTimestampSec.plus(secondsFromNow));
    },
    /**
     * Determines if the order is open and fillable by any taker.
     * @param order The order
     */
    isOpenOrder: function (order) {
        return order.takerAddress === constants_1.constants.NULL_ADDRESS;
    },
    /**
     * Given an amount of taker asset, calculate the the amount of maker asset
     * @param order The order
     * @param makerFillAmount the amount of taker asset
     */
    getMakerFillAmount: function (order, takerFillAmount) {
        // Round down because exchange rate favors Maker
        var makerFillAmount = takerFillAmount
            .multipliedBy(order.makerAssetAmount)
            .div(order.takerAssetAmount)
            .integerValue(utils_1.BigNumber.ROUND_FLOOR);
        return makerFillAmount;
    },
    /**
     * Given an amount of maker asset, calculate the equivalent amount in taker asset
     * @param order The order
     * @param makerFillAmount the amount of maker asset
     */
    getTakerFillAmount: function (order, makerFillAmount) {
        // Round up because exchange rate favors Maker
        var takerFillAmount = makerFillAmount
            .multipliedBy(order.takerAssetAmount)
            .div(order.makerAssetAmount)
            .integerValue(utils_1.BigNumber.ROUND_CEIL);
        return takerFillAmount;
    },
    /**
     * Given an amount of taker asset, calculate the fee amount required for the taker
     * @param order The order
     * @param takerFillAmount the amount of taker asset
     */
    getTakerFeeAmount: function (order, takerFillAmount) {
        // Round down because Taker fee rate favors Taker
        var takerFeeAmount = takerFillAmount
            .multipliedBy(order.takerFee)
            .div(order.takerAssetAmount)
            .integerValue(utils_1.BigNumber.ROUND_FLOOR);
        return takerFeeAmount;
    },
    /**
     * Given an amount of maker asset, calculate the fee amount required for the maker
     * @param order The order
     * @param makerFillAmount the amount of maker asset
     */
    getMakerFeeAmount: function (order, makerFillAmount) {
        // Round down because Maker fee rate favors Maker
        var makerFeeAmount = makerFillAmount
            .multipliedBy(order.makerFee)
            .div(order.makerAssetAmount)
            .integerValue(utils_1.BigNumber.ROUND_FLOOR);
        return makerFeeAmount;
    },
    /**
     * Given a desired amount of ZRX from a fee order, calculate the amount of taker asset required to fill.
     * Also calculate how much ZRX needs to be purchased in order to fill the desired amount plus the taker fee amount
     * @param order The order
     * @param makerFillAmount the amount of maker asset
     */
    getTakerFillAmountForFeeOrder: function (order, makerFillAmount) {
        // For each unit of TakerAsset we buy (MakerAsset - TakerFee)
        var adjustedTakerFillAmount = makerFillAmount
            .multipliedBy(order.takerAssetAmount)
            .div(order.makerAssetAmount.minus(order.takerFee))
            .integerValue(utils_1.BigNumber.ROUND_CEIL);
        // The amount that we buy will be greater than makerFillAmount, since we buy some amount for fees.
        var adjustedMakerFillAmount = exports.orderCalculationUtils.getMakerFillAmount(order, adjustedTakerFillAmount);
        return [adjustedTakerFillAmount, adjustedMakerFillAmount];
    },
};
//# sourceMappingURL=order_calculation_utils.js.map