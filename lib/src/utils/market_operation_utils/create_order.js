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
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var order_utils_1 = require("@0x/order-utils");
var utils_1 = require("@0x/utils");
var constants_1 = require("../../constants");
var constants_2 = require("./constants");
var types_1 = require("./types");
var NULL_BYTES = constants_1.constants.NULL_BYTES, NULL_ADDRESS = constants_1.constants.NULL_ADDRESS, ZERO_AMOUNT = constants_1.constants.ZERO_AMOUNT;
var INFINITE_TIMESTAMP_SEC = constants_2.constants.INFINITE_TIMESTAMP_SEC, WALLET_SIGNATURE = constants_2.constants.WALLET_SIGNATURE;
var CreateOrderUtils = /** @class */ (function () {
    function CreateOrderUtils(contractAddress) {
        this._contractAddress = contractAddress;
    }
    // Convert sell fills into orders.
    CreateOrderUtils.prototype.createSellOrdersFromPath = function (orderDomain, inputToken, outputToken, path, bridgeSlippage) {
        var e_1, _a;
        var orders = [];
        try {
            for (var path_1 = __values(path), path_1_1 = path_1.next(); !path_1_1.done; path_1_1 = path_1.next()) {
                var fill = path_1_1.value;
                if (fill.source === types_1.ERC20BridgeSource.Native) {
                    orders.push(createNativeOrder(fill));
                }
                else {
                    orders.push(createBridgeOrder(orderDomain, fill, this._getBridgeAddressFromSource(fill.source), outputToken, inputToken, bridgeSlippage));
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (path_1_1 && !path_1_1.done && (_a = path_1.return)) _a.call(path_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return orders;
    };
    // Convert buy fills into orders.
    CreateOrderUtils.prototype.createBuyOrdersFromPath = function (orderDomain, inputToken, outputToken, path, bridgeSlippage) {
        var e_2, _a;
        var orders = [];
        try {
            for (var path_2 = __values(path), path_2_1 = path_2.next(); !path_2_1.done; path_2_1 = path_2.next()) {
                var fill = path_2_1.value;
                if (fill.source === types_1.ERC20BridgeSource.Native) {
                    orders.push(createNativeOrder(fill));
                }
                else {
                    orders.push(createBridgeOrder(orderDomain, fill, this._getBridgeAddressFromSource(fill.source), inputToken, outputToken, bridgeSlippage, true));
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (path_2_1 && !path_2_1.done && (_a = path_2.return)) _a.call(path_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return orders;
    };
    CreateOrderUtils.prototype._getBridgeAddressFromSource = function (source) {
        switch (source) {
            case types_1.ERC20BridgeSource.Eth2Dai:
                return this._contractAddress.eth2DaiBridge;
            case types_1.ERC20BridgeSource.Kyber:
                return this._contractAddress.kyberBridge;
            case types_1.ERC20BridgeSource.Uniswap:
                return this._contractAddress.uniswapBridge;
            case types_1.ERC20BridgeSource.CurveUsdcDai:
            case types_1.ERC20BridgeSource.CurveUsdcDaiUsdt:
            case types_1.ERC20BridgeSource.CurveUsdcDaiUsdtTusd:
                return this._contractAddress.curveBridge;
            default:
                break;
        }
        throw new Error(types_1.AggregationError.NoBridgeForSource);
    };
    return CreateOrderUtils;
}());
exports.CreateOrderUtils = CreateOrderUtils;
function createBridgeOrder(orderDomain, fill, bridgeAddress, makerToken, takerToken, slippage, isBuy) {
    if (isBuy === void 0) { isBuy = false; }
    var makerAssetData;
    if (fill.source === types_1.ERC20BridgeSource.CurveUsdcDai ||
        fill.source === types_1.ERC20BridgeSource.CurveUsdcDaiUsdt ||
        fill.source === types_1.ERC20BridgeSource.CurveUsdcDaiUsdtTusd) {
        var _a = constants_1.constants.DEFAULT_CURVE_OPTS[fill.source], curveAddress = _a.curveAddress, tokens = _a.tokens, version = _a.version;
        var fromTokenIdx = tokens.indexOf(takerToken);
        var toTokenIdx = tokens.indexOf(makerToken);
        makerAssetData = order_utils_1.assetDataUtils.encodeERC20BridgeAssetData(makerToken, bridgeAddress, createCurveBridgeData(curveAddress, fromTokenIdx, toTokenIdx, version));
    }
    else {
        makerAssetData = order_utils_1.assetDataUtils.encodeERC20BridgeAssetData(makerToken, bridgeAddress, createBridgeData(takerToken));
    }
    return __assign({ makerAddress: bridgeAddress, makerAssetData: makerAssetData, takerAssetData: order_utils_1.assetDataUtils.encodeERC20AssetData(takerToken) }, createCommonOrderFields(orderDomain, fill, slippage, isBuy));
}
function createBridgeData(tokenAddress) {
    var encoder = utils_1.AbiEncoder.create([{ name: 'tokenAddress', type: 'address' }]);
    return encoder.encode({ tokenAddress: tokenAddress });
}
function createCurveBridgeData(curveAddress, fromTokenIdx, toTokenIdx, version) {
    var curveBridgeDataEncoder = utils_1.AbiEncoder.create([
        { name: 'curveAddress', type: 'address' },
        { name: 'fromTokenIdx', type: 'int128' },
        { name: 'toTokenIdx', type: 'int128' },
        { name: 'version', type: 'int128' },
    ]);
    return curveBridgeDataEncoder.encode([curveAddress, fromTokenIdx, toTokenIdx, version]);
}
function createCommonOrderFields(orderDomain, fill, slippage, isBuy) {
    if (isBuy === void 0) { isBuy = false; }
    var makerAssetAmountAdjustedWithSlippage = isBuy
        ? fill.totalMakerAssetAmount
        : fill.totalMakerAssetAmount.times(1 - slippage).integerValue(utils_1.BigNumber.ROUND_DOWN);
    var takerAssetAmountAdjustedWithSlippage = isBuy
        ? fill.totalTakerAssetAmount.times(slippage + 1).integerValue(utils_1.BigNumber.ROUND_UP)
        : fill.totalTakerAssetAmount;
    return __assign({ fill: fill, takerAddress: NULL_ADDRESS, senderAddress: NULL_ADDRESS, feeRecipientAddress: NULL_ADDRESS, salt: order_utils_1.generatePseudoRandomSalt(), expirationTimeSeconds: INFINITE_TIMESTAMP_SEC, makerFeeAssetData: NULL_BYTES, takerFeeAssetData: NULL_BYTES, makerFee: ZERO_AMOUNT, takerFee: ZERO_AMOUNT, makerAssetAmount: makerAssetAmountAdjustedWithSlippage, fillableMakerAssetAmount: makerAssetAmountAdjustedWithSlippage, takerAssetAmount: takerAssetAmountAdjustedWithSlippage, fillableTakerAssetAmount: takerAssetAmountAdjustedWithSlippage, fillableTakerFeeAmount: ZERO_AMOUNT, signature: WALLET_SIGNATURE }, orderDomain);
}
function createNativeOrder(fill) {
    return __assign({ fill: {
            source: fill.source,
            totalMakerAssetAmount: fill.totalMakerAssetAmount,
            totalTakerAssetAmount: fill.totalTakerAssetAmount,
            subFills: fill.subFills,
        } }, fill.nativeOrder);
}
//# sourceMappingURL=create_order.js.map