"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var json_schemas_1 = require("@0x/json-schemas");
var _ = require("lodash");
var assert_1 = require("./assert");
var utils_1 = require("./utils");
exports.sortingUtils = {
    sortOrders: function (orders) {
        assert_1.assert.doesConformToSchema('orders', orders, json_schemas_1.schemas.ordersSchema);
        assert_1.assert.isValidOrdersForSwapQuoter('orders', orders);
        var copiedOrders = _.cloneDeep(orders);
        copiedOrders.sort(function (firstOrder, secondOrder) {
            var firstOrderRate = getTakerFeeAdjustedRateOfOrder(firstOrder);
            var secondOrderRate = getTakerFeeAdjustedRateOfOrder(secondOrder);
            return firstOrderRate.comparedTo(secondOrderRate);
        });
        return copiedOrders;
    },
};
function getTakerFeeAdjustedRateOfOrder(order) {
    var _a = __read(utils_1.utils.getAdjustedMakerAndTakerAmountsFromTakerFees(order), 2), adjustedMakerAssetAmount = _a[0], adjustedTakerAssetAmount = _a[1];
    var rate = adjustedTakerAssetAmount.div(adjustedMakerAssetAmount);
    return rate;
}
//# sourceMappingURL=sorting_utils.js.map