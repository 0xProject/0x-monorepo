"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var json_schemas_1 = require("@0x/json-schemas");
var types_1 = require("@0x/types");
var utils_1 = require("@0x/utils");
var _ = require("lodash");
var assert_1 = require("./assert");
var constants_1 = require("./constants");
exports.marketUtils = {
    findOrdersThatCoverTakerAssetFillAmount: function (orders, takerAssetFillAmount, opts) {
        return findOrdersThatCoverAssetFillAmount(orders, takerAssetFillAmount, types_1.MarketOperation.Sell, opts);
    },
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
    findOrdersThatCoverMakerAssetFillAmount: function (orders, makerAssetFillAmount, opts) {
        return findOrdersThatCoverAssetFillAmount(orders, makerAssetFillAmount, types_1.MarketOperation.Buy, opts);
    },
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
    findFeeOrdersThatCoverFeesForTargetOrders: function (orders, feeOrders, opts) {
        assert_1.assert.doesConformToSchema('orders', orders, json_schemas_1.schemas.ordersSchema);
        assert_1.assert.doesConformToSchema('feeOrders', feeOrders, json_schemas_1.schemas.ordersSchema);
        // try to get remainingFillableMakerAssetAmounts from opts, if it's not there, use makerAssetAmount values from orders
        var remainingFillableMakerAssetAmounts = _.get(opts, 'remainingFillableMakerAssetAmounts', _.map(orders, function (order) { return order.makerAssetAmount; }));
        _.forEach(remainingFillableMakerAssetAmounts, function (amount, index) {
            return assert_1.assert.isValidBaseUnitAmount("remainingFillableMakerAssetAmount[" + index + "]", amount);
        });
        assert_1.assert.assert(orders.length === remainingFillableMakerAssetAmounts.length, 'Expected orders.length to equal opts.remainingFillableMakerAssetAmounts.length');
        // try to get remainingFillableFeeAmounts from opts, if it's not there, use makerAssetAmount values from feeOrders
        var remainingFillableFeeAmounts = _.get(opts, 'remainingFillableFeeAmounts', _.map(feeOrders, function (order) { return order.makerAssetAmount; }));
        _.forEach(remainingFillableFeeAmounts, function (amount, index) {
            return assert_1.assert.isValidBaseUnitAmount("remainingFillableFeeAmounts[" + index + "]", amount);
        });
        assert_1.assert.assert(feeOrders.length === remainingFillableFeeAmounts.length, 'Expected feeOrders.length to equal opts.remainingFillableFeeAmounts.length');
        // try to get slippageBufferAmount from opts, if it's not there, default to 0
        var slippageBufferAmount = _.get(opts, 'slippageBufferAmount', constants_1.constants.ZERO_AMOUNT);
        assert_1.assert.isValidBaseUnitAmount('opts.slippageBufferAmount', slippageBufferAmount);
        // calculate total amount of ZRX needed to fill orders
        var totalFeeAmount = _.reduce(orders, function (accFees, order, index) {
            var makerAssetAmountAvailable = remainingFillableMakerAssetAmounts[index];
            var feeToFillMakerAssetAmountAvailable = makerAssetAmountAvailable
                .multipliedBy(order.takerFee)
                .dividedToIntegerBy(order.makerAssetAmount);
            return accFees.plus(feeToFillMakerAssetAmountAvailable);
        }, constants_1.constants.ZERO_AMOUNT);
        var _a = exports.marketUtils.findOrdersThatCoverMakerAssetFillAmount(feeOrders, totalFeeAmount, {
            remainingFillableMakerAssetAmounts: remainingFillableFeeAmounts,
            slippageBufferAmount: slippageBufferAmount,
        }), resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount, ordersRemainingFillableMakerAssetAmounts = _a.ordersRemainingFillableMakerAssetAmounts;
        return {
            resultFeeOrders: resultOrders,
            remainingFeeAmount: remainingFillAmount,
            feeOrdersRemainingFillableMakerAssetAmounts: ordersRemainingFillableMakerAssetAmounts,
        };
        // TODO: add more orders here to cover rounding
        // https://github.com/0xProject/0x-protocol-specification/blob/master/v2/forwarding-contract-specification.md#over-buying-zrx
    },
};
function findOrdersThatCoverAssetFillAmount(orders, assetFillAmount, operation, opts) {
    var variablePrefix = operation === types_1.MarketOperation.Buy ? 'Maker' : 'Taker';
    assert_1.assert.doesConformToSchema('orders', orders, json_schemas_1.schemas.ordersSchema);
    assert_1.assert.isValidBaseUnitAmount('assetFillAmount', assetFillAmount);
    // try to get remainingFillableTakerAssetAmounts from opts, if it's not there, use takerAssetAmount values from orders
    var remainingFillableAssetAmounts = _.get(opts, "remainingFillable" + variablePrefix + "AssetAmounts", _.map(orders, function (order) { return (operation === types_1.MarketOperation.Buy ? order.makerAssetAmount : order.takerAssetAmount); }));
    _.forEach(remainingFillableAssetAmounts, function (amount, index) {
        return assert_1.assert.isValidBaseUnitAmount("remainingFillable" + variablePrefix + "AssetAmount[" + index + "]", amount);
    });
    assert_1.assert.assert(orders.length === remainingFillableAssetAmounts.length, "Expected orders.length to equal opts.remainingFillable" + variablePrefix + "AssetAmounts.length");
    // try to get slippageBufferAmount from opts, if it's not there, default to 0
    var slippageBufferAmount = _.get(opts, 'slippageBufferAmount', constants_1.constants.ZERO_AMOUNT);
    assert_1.assert.isValidBaseUnitAmount('opts.slippageBufferAmount', slippageBufferAmount);
    // calculate total amount of asset needed to be filled
    var totalFillAmount = assetFillAmount.plus(slippageBufferAmount);
    // iterate through the orders input from left to right until we have enough makerAsset to fill totalFillAmount
    var result = _.reduce(orders, function (_a, order, index) {
        var resultOrders = _a.resultOrders, remainingFillAmount = _a.remainingFillAmount, ordersRemainingFillableAssetAmounts = _a.ordersRemainingFillableAssetAmounts;
        if (remainingFillAmount.isLessThanOrEqualTo(constants_1.constants.ZERO_AMOUNT)) {
            return {
                resultOrders: resultOrders,
                remainingFillAmount: constants_1.constants.ZERO_AMOUNT,
                ordersRemainingFillableAssetAmounts: ordersRemainingFillableAssetAmounts,
            };
        }
        else {
            var assetAmountAvailable = remainingFillableAssetAmounts[index];
            var shouldIncludeOrder = assetAmountAvailable.gt(constants_1.constants.ZERO_AMOUNT);
            // if there is no assetAmountAvailable do not append order to resultOrders
            // if we have exceeded the total amount we want to fill set remainingFillAmount to 0
            return {
                resultOrders: shouldIncludeOrder ? _.concat(resultOrders, order) : resultOrders,
                ordersRemainingFillableAssetAmounts: shouldIncludeOrder
                    ? _.concat(ordersRemainingFillableAssetAmounts, assetAmountAvailable)
                    : ordersRemainingFillableAssetAmounts,
                remainingFillAmount: utils_1.BigNumber.max(constants_1.constants.ZERO_AMOUNT, remainingFillAmount.minus(assetAmountAvailable)),
            };
        }
    }, {
        resultOrders: [],
        remainingFillAmount: totalFillAmount,
        ordersRemainingFillableAssetAmounts: [],
    });
    var resultOrdersRemainingFillableAssetAmounts = result.ordersRemainingFillableAssetAmounts, 
    // tslint:disable-next-line: trailing-comma
    ordersAndRemainingFillAmount = __rest(result, ["ordersRemainingFillableAssetAmounts"]);
    if (operation === types_1.MarketOperation.Buy) {
        return __assign({}, ordersAndRemainingFillAmount, { ordersRemainingFillableMakerAssetAmounts: resultOrdersRemainingFillableAssetAmounts });
    }
    else {
        return __assign({}, ordersAndRemainingFillAmount, { ordersRemainingFillableTakerAssetAmounts: resultOrdersRemainingFillableAssetAmounts });
    }
}
//# sourceMappingURL=market_utils.js.map