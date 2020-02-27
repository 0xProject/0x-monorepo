"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
var utils_2 = require("./utils");
exports.calculateLiquidity = function (prunedOrders) {
    var liquidityInBigNumbers = prunedOrders.reduce(function (acc, order) {
        var fillableMakerAssetAmount = utils_2.utils.isOrderTakerFeePayableWithMakerAsset(order)
            ? order.fillableMakerAssetAmount.minus(order.fillableTakerFeeAmount)
            : order.fillableMakerAssetAmount;
        var fillableTakerAssetAmount = utils_2.utils.isOrderTakerFeePayableWithTakerAsset(order)
            ? order.fillableTakerAssetAmount.plus(order.fillableTakerFeeAmount)
            : order.fillableTakerAssetAmount;
        return {
            makerAssetAvailableInBaseUnits: acc.makerAssetAvailableInBaseUnits.plus(fillableMakerAssetAmount),
            takerAssetAvailableInBaseUnits: acc.takerAssetAvailableInBaseUnits.plus(fillableTakerAssetAmount),
        };
    }, {
        makerAssetAvailableInBaseUnits: new utils_1.BigNumber(0),
        takerAssetAvailableInBaseUnits: new utils_1.BigNumber(0),
    });
    return liquidityInBigNumbers;
};
//# sourceMappingURL=calculate_liquidity.js.map