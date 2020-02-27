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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var order_utils_1 = require("@0x/order-utils");
var utils_1 = require("@0x/utils");
var _ = require("lodash");
var constants_1 = require("../constants");
var types_1 = require("../types");
var fillable_amounts_utils_1 = require("./fillable_amounts_utils");
var types_2 = require("./market_operation_utils/types");
var utils_2 = require("./utils");
// TODO(dave4506) How do we want to reintroduce InsufficientAssetLiquidityError?
var SwapQuoteCalculator = /** @class */ (function () {
    function SwapQuoteCalculator(protocolFeeUtils, marketOperationUtils) {
        this._protocolFeeUtils = protocolFeeUtils;
        this._marketOperationUtils = marketOperationUtils;
    }
    SwapQuoteCalculator.prototype.calculateMarketSellSwapQuoteAsync = function (prunedOrders, takerAssetFillAmount, slippagePercentage, gasPrice, opts) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._calculateSwapQuoteAsync(prunedOrders, takerAssetFillAmount, slippagePercentage, gasPrice, types_1.MarketOperation.Sell, opts)];
                    case 1: return [2 /*return*/, (_a.sent())];
                }
            });
        });
    };
    SwapQuoteCalculator.prototype.calculateMarketBuySwapQuoteAsync = function (prunedOrders, takerAssetFillAmount, slippagePercentage, gasPrice, opts) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._calculateSwapQuoteAsync(prunedOrders, takerAssetFillAmount, slippagePercentage, gasPrice, types_1.MarketOperation.Buy, opts)];
                    case 1: return [2 /*return*/, (_a.sent())];
                }
            });
        });
    };
    SwapQuoteCalculator.prototype.calculateBatchMarketBuySwapQuoteAsync = function (batchPrunedOrders, takerAssetFillAmounts, slippagePercentage, gasPrice, opts) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._calculateBatchBuySwapQuoteAsync(batchPrunedOrders, takerAssetFillAmounts, slippagePercentage, gasPrice, types_1.MarketOperation.Buy, opts)];
                    case 1: return [2 /*return*/, (_a.sent())];
                }
            });
        });
    };
    SwapQuoteCalculator.prototype._calculateBatchBuySwapQuoteAsync = function (batchPrunedOrders, assetFillAmounts, slippagePercentage, gasPrice, operation, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var assetFillAmountsWithSlippage, batchSignedOrders, batchSwapQuotes;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assetFillAmountsWithSlippage = assetFillAmounts.map(function (a) {
                            return a.plus(a.multipliedBy(slippagePercentage).integerValue());
                        });
                        return [4 /*yield*/, this._marketOperationUtils.getBatchMarketBuyOrdersAsync(batchPrunedOrders, assetFillAmountsWithSlippage, opts)];
                    case 1:
                        batchSignedOrders = _a.sent();
                        return [4 /*yield*/, Promise.all(batchSignedOrders.map(function (orders, i) { return __awaiter(_this, void 0, void 0, function () {
                                var _a, makerAssetData, takerAssetData;
                                return __generator(this, function (_b) {
                                    if (orders) {
                                        _a = batchPrunedOrders[i][0], makerAssetData = _a.makerAssetData, takerAssetData = _a.takerAssetData;
                                        return [2 /*return*/, this._createSwapQuoteAsync(makerAssetData, takerAssetData, orders, operation, assetFillAmounts[i], gasPrice)];
                                    }
                                    else {
                                        return [2 /*return*/, undefined];
                                    }
                                    return [2 /*return*/];
                                });
                            }); }))];
                    case 2:
                        batchSwapQuotes = _a.sent();
                        return [2 /*return*/, batchSwapQuotes];
                }
            });
        });
    };
    SwapQuoteCalculator.prototype._calculateSwapQuoteAsync = function (prunedOrders, assetFillAmount, slippagePercentage, gasPrice, operation, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var slippageBufferAmount, resultOrders, _opts, _a, makerAssetData, takerAssetData;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        slippageBufferAmount = assetFillAmount.multipliedBy(slippagePercentage).integerValue();
                        resultOrders = [];
                        _opts = __assign({}, opts, { fees: _.mapValues(opts.fees, function (v, k) { return v.times(gasPrice); }) });
                        if (!(operation === types_1.MarketOperation.Buy)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._marketOperationUtils.getMarketBuyOrdersAsync(prunedOrders, assetFillAmount.plus(slippageBufferAmount), _opts)];
                    case 1:
                        resultOrders = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this._marketOperationUtils.getMarketSellOrdersAsync(prunedOrders, assetFillAmount.plus(slippageBufferAmount), _opts)];
                    case 3:
                        resultOrders = _b.sent();
                        _b.label = 4;
                    case 4:
                        _a = prunedOrders[0], makerAssetData = _a.makerAssetData, takerAssetData = _a.takerAssetData;
                        return [2 /*return*/, this._createSwapQuoteAsync(makerAssetData, takerAssetData, resultOrders, operation, assetFillAmount, gasPrice)];
                }
            });
        });
    };
    SwapQuoteCalculator.prototype._createSwapQuoteAsync = function (makerAssetData, takerAssetData, resultOrders, operation, assetFillAmount, gasPrice) {
        return __awaiter(this, void 0, void 0, function () {
            var bestCaseQuoteInfo, worstCaseQuoteInfo, breakdown, quoteBase;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._calculateQuoteInfoAsync(resultOrders, assetFillAmount, gasPrice, operation)];
                    case 1:
                        bestCaseQuoteInfo = _a.sent();
                        return [4 /*yield*/, this._calculateQuoteInfoAsync(resultOrders, assetFillAmount, gasPrice, operation, true)];
                    case 2:
                        worstCaseQuoteInfo = _a.sent();
                        breakdown = this._getSwapQuoteOrdersBreakdown(resultOrders, operation);
                        quoteBase = {
                            takerAssetData: takerAssetData,
                            makerAssetData: makerAssetData,
                            // Remove fill metadata.
                            orders: resultOrders.map(function (o) { return _.omit(o, 'fill'); }),
                            bestCaseQuoteInfo: bestCaseQuoteInfo,
                            worstCaseQuoteInfo: worstCaseQuoteInfo,
                            gasPrice: gasPrice,
                            sourceBreakdown: breakdown,
                        };
                        if (operation === types_1.MarketOperation.Buy) {
                            return [2 /*return*/, __assign({}, quoteBase, { type: types_1.MarketOperation.Buy, makerAssetFillAmount: assetFillAmount })];
                        }
                        else {
                            return [2 /*return*/, __assign({}, quoteBase, { type: types_1.MarketOperation.Sell, takerAssetFillAmount: assetFillAmount })];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // tslint:disable-next-line: prefer-function-over-method
    SwapQuoteCalculator.prototype._calculateQuoteInfoAsync = function (orders, assetFillAmount, gasPrice, operation, worstCase) {
        if (worstCase === void 0) { worstCase = false; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (operation === types_1.MarketOperation.Buy) {
                    return [2 /*return*/, this._calculateMarketBuyQuoteInfoAsync(orders, assetFillAmount, gasPrice, worstCase)];
                }
                else {
                    return [2 /*return*/, this._calculateMarketSellQuoteInfoAsync(orders, assetFillAmount, gasPrice, worstCase)];
                }
                return [2 /*return*/];
            });
        });
    };
    SwapQuoteCalculator.prototype._calculateMarketSellQuoteInfoAsync = function (orders, takerAssetSellAmount, gasPrice, worstCase) {
        if (worstCase === void 0) { worstCase = false; }
        return __awaiter(this, void 0, void 0, function () {
            var e_1, _a, e_2, _b, totalMakerAssetAmount, totalTakerAssetAmount, totalFeeTakerAssetAmount, remainingTakerAssetFillAmount, filledOrders, _orders, _orders_1, _orders_1_1, order, makerAssetAmount, takerAssetAmount, feeTakerAssetAmount, adjustedFillableMakerAssetAmount, adjustedFillableTakerAssetAmount, takerAssetAmountWithFees, takerAssetAmountBreakDown, makerAssetBridgeSlippage, takerAssetBridgeSlippage, subFills, subFills_1, subFills_1_1, subFill, partialTakerAssetAmount, partialMakerAssetAmount, partialTakerAssetFillAmount, partialMakerAssetFillAmount, protocolFeeInWeiAmount;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        totalMakerAssetAmount = constants_1.constants.ZERO_AMOUNT;
                        totalTakerAssetAmount = constants_1.constants.ZERO_AMOUNT;
                        totalFeeTakerAssetAmount = constants_1.constants.ZERO_AMOUNT;
                        remainingTakerAssetFillAmount = takerAssetSellAmount;
                        filledOrders = [];
                        _orders = !worstCase ? orders : orders.slice().reverse();
                        try {
                            for (_orders_1 = __values(_orders), _orders_1_1 = _orders_1.next(); !_orders_1_1.done; _orders_1_1 = _orders_1.next()) {
                                order = _orders_1_1.value;
                                makerAssetAmount = constants_1.constants.ZERO_AMOUNT;
                                takerAssetAmount = constants_1.constants.ZERO_AMOUNT;
                                feeTakerAssetAmount = constants_1.constants.ZERO_AMOUNT;
                                if (remainingTakerAssetFillAmount.lte(0)) {
                                    break;
                                }
                                if (order.fill.source === types_2.ERC20BridgeSource.Native) {
                                    adjustedFillableMakerAssetAmount = fillable_amounts_utils_1.fillableAmountsUtils.getMakerAssetAmountSwappedAfterOrderFees(order);
                                    adjustedFillableTakerAssetAmount = fillable_amounts_utils_1.fillableAmountsUtils.getTakerAssetAmountSwappedAfterOrderFees(order);
                                    takerAssetAmountWithFees = utils_1.BigNumber.min(remainingTakerAssetFillAmount, adjustedFillableTakerAssetAmount);
                                    takerAssetAmountBreakDown = getTakerAssetAmountBreakDown(order, takerAssetAmountWithFees);
                                    takerAssetAmount = takerAssetAmountBreakDown.takerAssetAmount;
                                    feeTakerAssetAmount = takerAssetAmountBreakDown.feeTakerAssetAmount;
                                    makerAssetAmount = takerAssetAmountWithFees
                                        .div(adjustedFillableTakerAssetAmount)
                                        .times(adjustedFillableMakerAssetAmount)
                                        .integerValue(utils_1.BigNumber.ROUND_DOWN);
                                }
                                else {
                                    makerAssetBridgeSlippage = !worstCase
                                        ? constants_1.constants.ONE_AMOUNT
                                        : order.makerAssetAmount.div(order.fill.totalMakerAssetAmount);
                                    takerAssetBridgeSlippage = !worstCase
                                        ? constants_1.constants.ONE_AMOUNT
                                        : order.takerAssetAmount.div(order.fill.totalTakerAssetAmount);
                                    subFills = !worstCase ? order.fill.subFills : order.fill.subFills.slice().reverse();
                                    try {
                                        for (subFills_1 = __values(subFills), subFills_1_1 = subFills_1.next(); !subFills_1_1.done; subFills_1_1 = subFills_1.next()) {
                                            subFill = subFills_1_1.value;
                                            if (remainingTakerAssetFillAmount.minus(takerAssetAmount).lte(0)) {
                                                break;
                                            }
                                            partialTakerAssetAmount = subFill.takerAssetAmount.times(takerAssetBridgeSlippage);
                                            partialMakerAssetAmount = subFill.makerAssetAmount.times(makerAssetBridgeSlippage);
                                            partialTakerAssetFillAmount = utils_1.BigNumber.min(partialTakerAssetAmount, remainingTakerAssetFillAmount.minus(takerAssetAmount));
                                            partialMakerAssetFillAmount = partialTakerAssetFillAmount
                                                .div(partialTakerAssetAmount)
                                                .times(partialMakerAssetAmount)
                                                .integerValue(utils_1.BigNumber.ROUND_DOWN);
                                            takerAssetAmount = takerAssetAmount.plus(partialTakerAssetFillAmount);
                                            makerAssetAmount = makerAssetAmount.plus(partialMakerAssetFillAmount);
                                        }
                                    }
                                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                                    finally {
                                        try {
                                            if (subFills_1_1 && !subFills_1_1.done && (_b = subFills_1.return)) _b.call(subFills_1);
                                        }
                                        finally { if (e_2) throw e_2.error; }
                                    }
                                }
                                totalMakerAssetAmount = totalMakerAssetAmount.plus(makerAssetAmount);
                                totalTakerAssetAmount = totalTakerAssetAmount.plus(takerAssetAmount);
                                totalFeeTakerAssetAmount = totalFeeTakerAssetAmount.plus(feeTakerAssetAmount);
                                remainingTakerAssetFillAmount = remainingTakerAssetFillAmount
                                    .minus(takerAssetAmount)
                                    .minus(feeTakerAssetAmount);
                                filledOrders.push(order);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (_orders_1_1 && !_orders_1_1.done && (_a = _orders_1.return)) _a.call(_orders_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return [4 /*yield*/, this._protocolFeeUtils.calculateWorstCaseProtocolFeeAsync(!worstCase ? filledOrders : orders, gasPrice)];
                    case 1:
                        protocolFeeInWeiAmount = _c.sent();
                        return [2 /*return*/, {
                                feeTakerAssetAmount: totalFeeTakerAssetAmount,
                                takerAssetAmount: totalTakerAssetAmount,
                                totalTakerAssetAmount: totalFeeTakerAssetAmount.plus(totalTakerAssetAmount),
                                makerAssetAmount: totalMakerAssetAmount,
                                protocolFeeInWeiAmount: protocolFeeInWeiAmount,
                            }];
                }
            });
        });
    };
    SwapQuoteCalculator.prototype._calculateMarketBuyQuoteInfoAsync = function (orders, makerAssetBuyAmount, gasPrice, worstCase) {
        if (worstCase === void 0) { worstCase = false; }
        return __awaiter(this, void 0, void 0, function () {
            var e_3, _a, e_4, _b, totalMakerAssetAmount, totalTakerAssetAmount, totalFeeTakerAssetAmount, remainingMakerAssetFillAmount, filledOrders, _orders, _orders_2, _orders_2_1, order, makerAssetAmount, takerAssetAmount, feeTakerAssetAmount, adjustedFillableMakerAssetAmount, adjustedFillableTakerAssetAmount, takerAssetAmountWithFees, takerAssetAmountBreakDown, makerAssetBridgeSlippage, takerAssetBridgeSlippage, subFills, subFills_2, subFills_2_1, subFill, partialTakerAssetAmount, partialMakerAssetAmount, partialMakerAssetFillAmount, partialTakerAssetFillAmount, protocolFeeInWeiAmount;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        totalMakerAssetAmount = constants_1.constants.ZERO_AMOUNT;
                        totalTakerAssetAmount = constants_1.constants.ZERO_AMOUNT;
                        totalFeeTakerAssetAmount = constants_1.constants.ZERO_AMOUNT;
                        remainingMakerAssetFillAmount = makerAssetBuyAmount;
                        filledOrders = [];
                        _orders = !worstCase ? orders : orders.slice().reverse();
                        try {
                            for (_orders_2 = __values(_orders), _orders_2_1 = _orders_2.next(); !_orders_2_1.done; _orders_2_1 = _orders_2.next()) {
                                order = _orders_2_1.value;
                                makerAssetAmount = constants_1.constants.ZERO_AMOUNT;
                                takerAssetAmount = constants_1.constants.ZERO_AMOUNT;
                                feeTakerAssetAmount = constants_1.constants.ZERO_AMOUNT;
                                if (remainingMakerAssetFillAmount.lte(0)) {
                                    break;
                                }
                                if (order.fill.source === types_2.ERC20BridgeSource.Native) {
                                    adjustedFillableMakerAssetAmount = fillable_amounts_utils_1.fillableAmountsUtils.getMakerAssetAmountSwappedAfterOrderFees(order);
                                    adjustedFillableTakerAssetAmount = fillable_amounts_utils_1.fillableAmountsUtils.getTakerAssetAmountSwappedAfterOrderFees(order);
                                    makerAssetAmount = utils_1.BigNumber.min(remainingMakerAssetFillAmount, adjustedFillableMakerAssetAmount);
                                    takerAssetAmountWithFees = makerAssetAmount
                                        .div(adjustedFillableMakerAssetAmount)
                                        .multipliedBy(adjustedFillableTakerAssetAmount)
                                        .integerValue(utils_1.BigNumber.ROUND_UP);
                                    takerAssetAmountBreakDown = getTakerAssetAmountBreakDown(order, takerAssetAmountWithFees);
                                    takerAssetAmount = takerAssetAmountBreakDown.takerAssetAmount;
                                    feeTakerAssetAmount = takerAssetAmountBreakDown.feeTakerAssetAmount;
                                }
                                else {
                                    makerAssetBridgeSlippage = !worstCase
                                        ? constants_1.constants.ONE_AMOUNT
                                        : order.makerAssetAmount.div(order.fill.totalMakerAssetAmount);
                                    takerAssetBridgeSlippage = !worstCase
                                        ? constants_1.constants.ONE_AMOUNT
                                        : order.takerAssetAmount.div(order.fill.totalTakerAssetAmount);
                                    subFills = !worstCase ? order.fill.subFills : order.fill.subFills.slice().reverse();
                                    try {
                                        for (subFills_2 = __values(subFills), subFills_2_1 = subFills_2.next(); !subFills_2_1.done; subFills_2_1 = subFills_2.next()) {
                                            subFill = subFills_2_1.value;
                                            if (remainingMakerAssetFillAmount.minus(makerAssetAmount).lte(0)) {
                                                break;
                                            }
                                            partialTakerAssetAmount = subFill.takerAssetAmount.times(takerAssetBridgeSlippage);
                                            partialMakerAssetAmount = subFill.makerAssetAmount.times(makerAssetBridgeSlippage);
                                            partialMakerAssetFillAmount = utils_1.BigNumber.min(partialMakerAssetAmount, remainingMakerAssetFillAmount.minus(makerAssetAmount));
                                            partialTakerAssetFillAmount = partialMakerAssetFillAmount
                                                .div(partialMakerAssetAmount)
                                                .times(partialTakerAssetAmount)
                                                .integerValue(utils_1.BigNumber.ROUND_UP);
                                            takerAssetAmount = takerAssetAmount.plus(partialTakerAssetFillAmount);
                                            makerAssetAmount = makerAssetAmount.plus(partialMakerAssetFillAmount);
                                        }
                                    }
                                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                                    finally {
                                        try {
                                            if (subFills_2_1 && !subFills_2_1.done && (_b = subFills_2.return)) _b.call(subFills_2);
                                        }
                                        finally { if (e_4) throw e_4.error; }
                                    }
                                }
                                totalMakerAssetAmount = totalMakerAssetAmount.plus(makerAssetAmount);
                                totalTakerAssetAmount = totalTakerAssetAmount.plus(takerAssetAmount);
                                totalFeeTakerAssetAmount = totalFeeTakerAssetAmount.plus(feeTakerAssetAmount);
                                remainingMakerAssetFillAmount = remainingMakerAssetFillAmount.minus(makerAssetAmount);
                                filledOrders.push(order);
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (_orders_2_1 && !_orders_2_1.done && (_a = _orders_2.return)) _a.call(_orders_2);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                        return [4 /*yield*/, this._protocolFeeUtils.calculateWorstCaseProtocolFeeAsync(!worstCase ? filledOrders : orders, gasPrice)];
                    case 1:
                        protocolFeeInWeiAmount = _c.sent();
                        return [2 /*return*/, {
                                feeTakerAssetAmount: totalFeeTakerAssetAmount,
                                takerAssetAmount: totalTakerAssetAmount,
                                totalTakerAssetAmount: totalFeeTakerAssetAmount.plus(totalTakerAssetAmount),
                                makerAssetAmount: totalMakerAssetAmount,
                                protocolFeeInWeiAmount: protocolFeeInWeiAmount,
                            }];
                }
            });
        });
    };
    // tslint:disable-next-line: prefer-function-over-method
    SwapQuoteCalculator.prototype._getSwapQuoteOrdersBreakdown = function (orders, operation) {
        // HACK: to shut up linter
        var breakdown = {};
        // total asset amount (accounting for slippage protection)
        var totalAssetAmount = utils_1.BigNumber.sum.apply(utils_1.BigNumber, __spread([
            constants_1.constants.ZERO_AMOUNT
        ], orders.map(function (o) { return (operation === types_1.MarketOperation.Buy ? o.makerAssetAmount : o.takerAssetAmount); })));
        return orders.reduce(function (acc, order) {
            var _a;
            var assetAmount = operation === types_1.MarketOperation.Buy ? order.makerAssetAmount : order.takerAssetAmount;
            var source = order.fill.source;
            return __assign({}, acc, (_a = {},
                _a[source] = !!acc[source]
                    ? acc[source].plus(assetAmount.dividedBy(totalAssetAmount))
                    : assetAmount.dividedBy(totalAssetAmount),
                _a));
        }, breakdown);
    };
    return SwapQuoteCalculator;
}());
exports.SwapQuoteCalculator = SwapQuoteCalculator;
function getTakerAssetAmountBreakDown(order, takerAssetAmountWithFees) {
    if (utils_2.utils.isOrderTakerFeePayableWithTakerAsset(order)) {
        var adjustedTakerAssetAmount = order.takerAssetAmount.plus(order.takerFee);
        var filledRatio = takerAssetAmountWithFees.div(adjustedTakerAssetAmount);
        var takerAssetAmount = filledRatio.multipliedBy(order.takerAssetAmount).integerValue(utils_1.BigNumber.ROUND_CEIL);
        return {
            takerAssetAmount: takerAssetAmount,
            feeTakerAssetAmount: takerAssetAmountWithFees.minus(takerAssetAmount),
        };
    }
    else if (utils_2.utils.isOrderTakerFeePayableWithMakerAsset(order)) {
        if (takerAssetAmountWithFees.isZero()) {
            return {
                takerAssetAmount: constants_1.constants.ZERO_AMOUNT,
                feeTakerAssetAmount: constants_1.constants.ZERO_AMOUNT,
            };
        }
        var takerFeeAmount = order_utils_1.orderCalculationUtils.getTakerFeeAmount(order, takerAssetAmountWithFees);
        var makerAssetFillAmount = order_utils_1.orderCalculationUtils.getMakerFillAmount(order, takerAssetAmountWithFees);
        var takerAssetAmount = takerFeeAmount
            .div(makerAssetFillAmount)
            .multipliedBy(takerAssetAmountWithFees)
            .integerValue(utils_1.BigNumber.ROUND_UP);
        return {
            takerAssetAmount: takerAssetAmount,
            feeTakerAssetAmount: takerAssetAmountWithFees.minus(takerAssetAmount),
        };
    }
    return {
        feeTakerAssetAmount: constants_1.constants.ZERO_AMOUNT,
        takerAssetAmount: takerAssetAmountWithFees,
    };
}
//# sourceMappingURL=swap_quote_calculator.js.map