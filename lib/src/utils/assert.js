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
Object.defineProperty(exports, "__esModule", { value: true });
var assert_1 = require("@0x/assert");
var json_schemas_1 = require("@0x/json-schemas");
var _ = require("lodash");
var types_1 = require("../types");
var utils_1 = require("./utils");
exports.assert = __assign({}, assert_1.assert, { isValidSwapQuote: function (variableName, swapQuote) {
        assert_1.assert.isHexString(variableName + ".takerAssetData", swapQuote.takerAssetData);
        assert_1.assert.isHexString(variableName + ".makerAssetData", swapQuote.makerAssetData);
        assert_1.assert.doesConformToSchema(variableName + ".orders", swapQuote.orders, json_schemas_1.schemas.signedOrdersSchema);
        exports.assert.isValidSwapQuoteOrders(variableName + ".orders", swapQuote.orders, swapQuote.makerAssetData, swapQuote.takerAssetData);
        exports.assert.isValidSwapQuoteInfo(variableName + ".bestCaseQuoteInfo", swapQuote.bestCaseQuoteInfo);
        exports.assert.isValidSwapQuoteInfo(variableName + ".worstCaseQuoteInfo", swapQuote.worstCaseQuoteInfo);
        if (swapQuote.type === types_1.MarketOperation.Buy) {
            assert_1.assert.isBigNumber(variableName + ".makerAssetFillAmount", swapQuote.makerAssetFillAmount);
        }
        else {
            assert_1.assert.isBigNumber(variableName + ".takerAssetFillAmount", swapQuote.takerAssetFillAmount);
        }
    },
    isValidSwapQuoteOrders: function (variableName, orders, makerAssetData, takerAssetData) {
        _.every(orders, function (order, index) {
            exports.assert.assert(utils_1.utils.isAssetDataEquivalent(takerAssetData, order.takerAssetData), "Expected " + variableName + "[" + index + "].takerAssetData to be " + takerAssetData + " but found " + order.takerAssetData);
            exports.assert.assert(utils_1.utils.isAssetDataEquivalent(makerAssetData, order.makerAssetData), "Expected " + variableName + "[" + index + "].makerAssetData to be " + makerAssetData + " but found " + order.makerAssetData);
        });
    },
    isValidOrdersForSwapQuoter: function (variableName, orders) {
        _.every(orders, function (order, index) {
            exports.assert.assert(order.takerFee.isZero() ||
                utils_1.utils.isOrderTakerFeePayableWithTakerAsset(order) ||
                utils_1.utils.isOrderTakerFeePayableWithMakerAsset(order), "Expected " + variableName + "[" + index + "].takerFeeAssetData to be " + order.makerAssetData + " or " + order.takerAssetData + " but found " + order.takerFeeAssetData);
        });
    },
    isValidForwarderSwapQuote: function (variableName, swapQuote, wethAssetData) {
        exports.assert.isValidSwapQuote(variableName, swapQuote);
        exports.assert.isValidForwarderSignedOrders(variableName + ".orders", swapQuote.orders, wethAssetData);
    },
    isValidForwarderSignedOrders: function (variableName, orders, wethAssetData) {
        _.forEach(orders, function (o, i) {
            exports.assert.isValidForwarderSignedOrder(variableName + "[" + i + "]", o, wethAssetData);
        });
    },
    isValidForwarderSignedOrder: function (variableName, order, wethAssetData) {
        exports.assert.assert(utils_1.utils.isExactAssetData(order.takerAssetData, wethAssetData), "Expected " + variableName + " to have takerAssetData set as " + wethAssetData + ", but is " + order.takerAssetData);
    },
    isValidSwapQuoteInfo: function (variableName, swapQuoteInfo) {
        assert_1.assert.isBigNumber(variableName + ".feeTakerAssetAmount", swapQuoteInfo.feeTakerAssetAmount);
        assert_1.assert.isBigNumber(variableName + ".totalTakerAssetAmount", swapQuoteInfo.totalTakerAssetAmount);
        assert_1.assert.isBigNumber(variableName + ".takerAssetAmount", swapQuoteInfo.takerAssetAmount);
        assert_1.assert.isBigNumber(variableName + ".makerAssetAmount", swapQuoteInfo.makerAssetAmount);
    },
    isValidOrderbook: function (variableName, orderFetcher) {
        assert_1.assert.isFunction(variableName + ".getOrdersAsync", orderFetcher.getOrdersAsync);
    },
    isValidOrderProviderRequest: function (variableName, orderFetcherRequest) {
        assert_1.assert.isHexString(variableName + ".makerAssetData", orderFetcherRequest.makerAssetData);
        assert_1.assert.isHexString(variableName + ".takerAssetData", orderFetcherRequest.takerAssetData);
    },
    isValidPercentage: function (variableName, percentage) {
        exports.assert.isNumber(variableName, percentage);
        exports.assert.assert(percentage >= 0 && percentage <= 1, "Expected " + variableName + " to be between 0 and 1, but is " + percentage);
    },
    isValidForwarderExtensionContractOpts: function (variableName, opts) {
        exports.assert.isValidPercentage(variableName + ".feePercentage", opts.feePercentage);
        exports.assert.isETHAddressHex(variableName + ".feeRecipient", opts.feeRecipient);
    } });
//# sourceMappingURL=assert.js.map