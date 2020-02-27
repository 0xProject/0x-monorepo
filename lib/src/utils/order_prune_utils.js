"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var order_utils_1 = require("@0x/order-utils");
var _ = require("lodash");
var constants_1 = require("../constants");
var types_1 = require("../types");
var utils_1 = require("../utils/utils");
exports.orderPrunerUtils = {
    pruneForUsableSignedOrders: function (signedOrders, permittedOrderFeeTypes, expiryBufferMs) {
        var result = _.filter(signedOrders, function (order) {
            return (order_utils_1.orderCalculationUtils.isOpenOrder(order) &&
                !order_utils_1.orderCalculationUtils.willOrderExpire(order, expiryBufferMs / constants_1.constants.ONE_SECOND_MS) &&
                ((permittedOrderFeeTypes.has(types_1.OrderPrunerPermittedFeeTypes.NoFees) &&
                    order.takerFee.eq(constants_1.constants.ZERO_AMOUNT)) ||
                    (permittedOrderFeeTypes.has(types_1.OrderPrunerPermittedFeeTypes.TakerDenominatedTakerFee) &&
                        utils_1.utils.isOrderTakerFeePayableWithTakerAsset(order)) ||
                    (permittedOrderFeeTypes.has(types_1.OrderPrunerPermittedFeeTypes.MakerDenominatedTakerFee) &&
                        utils_1.utils.isOrderTakerFeePayableWithMakerAsset(order))));
        });
        return result;
    },
};
//# sourceMappingURL=order_prune_utils.js.map