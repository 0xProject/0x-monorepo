"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var json_schemas_1 = require("@0x/json-schemas");
var _ = require("lodash");
var assert_1 = require("./assert");
var constants_1 = require("./constants");
var rate_utils_1 = require("./rate_utils");
exports.sortingUtils = {
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
    sortOrdersByFeeAdjustedRate: function (orders, feeRate) {
        if (feeRate === void 0) { feeRate = constants_1.constants.ZERO_AMOUNT; }
        assert_1.assert.doesConformToSchema('orders', orders, json_schemas_1.schemas.ordersSchema);
        assert_1.assert.isBigNumber('feeRate', feeRate);
        var rateCalculator = function (order) { return rate_utils_1.rateUtils.getFeeAdjustedRateOfOrder(order, feeRate); };
        var sortedOrders = sortOrders(orders, rateCalculator);
        return sortedOrders;
    },
    /**
     * Takes an array of fee orders (makerAssetData corresponds to ZRX and takerAssetData corresponds to WETH)
     * and sorts them by rate in ascending order (best rate first). Adjusts the rate according to the takerFee.
     * @param   feeOrders       An array of objects that extend the Order interface. All orders should specify ZRX as
     *                          the makerAsset and WETH as the takerAsset.
     * @return  The input orders sorted by rate in ascending order
     */
    sortFeeOrdersByFeeAdjustedRate: function (feeOrders) {
        assert_1.assert.doesConformToSchema('feeOrders', feeOrders, json_schemas_1.schemas.ordersSchema);
        var rateCalculator = rate_utils_1.rateUtils.getFeeAdjustedRateOfFeeOrder.bind(rate_utils_1.rateUtils);
        var sortedOrders = sortOrders(feeOrders, rateCalculator);
        return sortedOrders;
    },
};
// takes an array of orders, copies them, and sorts the copy based on the rate definition provided by rateCalculator
function sortOrders(orders, rateCalculator) {
    var copiedOrders = _.cloneDeep(orders);
    copiedOrders.sort(function (firstOrder, secondOrder) {
        var firstOrderRate = rateCalculator(firstOrder);
        var secondOrderRate = rateCalculator(secondOrder);
        return firstOrderRate.comparedTo(secondOrderRate);
    });
    return copiedOrders;
}
//# sourceMappingURL=sorting_utils.js.map