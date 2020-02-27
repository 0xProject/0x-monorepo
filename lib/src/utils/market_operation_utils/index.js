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
var types_1 = require("../../types");
var fillable_amounts_utils_1 = require("../fillable_amounts_utils");
var constants_2 = require("./constants");
var create_order_1 = require("./create_order");
var fill_optimizer_1 = require("./fill_optimizer");
var sampler_1 = require("./sampler");
var types_2 = require("./types");
var sampler_2 = require("./sampler");
exports.DexOrderSampler = sampler_2.DexOrderSampler;
var ZERO_AMOUNT = constants_1.constants.ZERO_AMOUNT;
var BUY_SOURCES = constants_2.constants.BUY_SOURCES, DEFAULT_GET_MARKET_ORDERS_OPTS = constants_2.constants.DEFAULT_GET_MARKET_ORDERS_OPTS, ERC20_PROXY_ID = constants_2.constants.ERC20_PROXY_ID, FEE_QUOTE_SOURCES = constants_2.constants.FEE_QUOTE_SOURCES, ONE_ETHER = constants_2.constants.ONE_ETHER, SELL_SOURCES = constants_2.constants.SELL_SOURCES;
var MarketOperationUtils = /** @class */ (function () {
    function MarketOperationUtils(_sampler, contractAddresses, _orderDomain) {
        this._sampler = _sampler;
        this._orderDomain = _orderDomain;
        this._createOrderUtils = new create_order_1.CreateOrderUtils(contractAddresses);
        this._wethAddress = contractAddresses.etherToken;
    }
    /**
     * gets the orders required for a market sell operation by (potentially) merging native orders with
     * generated bridge orders.
     * @param nativeOrders Native orders.
     * @param takerAmount Amount of taker asset to sell.
     * @param opts Options object.
     * @return orders.
     */
    MarketOperationUtils.prototype.getMarketSellOrdersAsync = function (nativeOrders, takerAmount, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var _opts, _a, makerToken, takerToken, _b, fillableAmounts, ethToMakerAssetRate, dexQuotes, nativeOrdersWithFillableAmounts, nativeFills, dexPaths, allPaths, allFills, optimizer, upperBoundPath, optimalPath;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (nativeOrders.length === 0) {
                            throw new Error(types_2.AggregationError.EmptyOrders);
                        }
                        _opts = __assign({}, DEFAULT_GET_MARKET_ORDERS_OPTS, opts);
                        _a = __read(getOrderTokens(nativeOrders[0]), 2), makerToken = _a[0], takerToken = _a[1];
                        return [4 /*yield*/, this._sampler.executeAsync(sampler_1.DexOrderSampler.ops.getOrderFillableTakerAmounts(nativeOrders), makerToken.toLowerCase() === this._wethAddress.toLowerCase()
                                ? sampler_1.DexOrderSampler.ops.constant(new utils_1.BigNumber(1))
                                : sampler_1.DexOrderSampler.ops.getMedianSellRate(difference(FEE_QUOTE_SOURCES, _opts.excludedSources), makerToken, this._wethAddress, ONE_ETHER), sampler_1.DexOrderSampler.ops.getSellQuotes(difference(SELL_SOURCES, _opts.excludedSources), makerToken, takerToken, sampler_1.getSampleAmounts(takerAmount, _opts.numSamples, _opts.sampleDistributionBase)))];
                    case 1:
                        _b = __read.apply(void 0, [_c.sent(), 3]), fillableAmounts = _b[0], ethToMakerAssetRate = _b[1], dexQuotes = _b[2];
                        nativeOrdersWithFillableAmounts = createSignedOrdersWithFillableAmounts(nativeOrders, fillableAmounts, types_1.MarketOperation.Sell);
                        nativeFills = pruneNativeFills(fill_optimizer_1.sortFillsByAdjustedRate(createSellPathFromNativeOrders(nativeOrdersWithFillableAmounts, ethToMakerAssetRate, _opts)), takerAmount, _opts.dustFractionThreshold);
                        dexPaths = createSellPathsFromDexQuotes(dexQuotes, ethToMakerAssetRate, _opts);
                        allPaths = __spread(dexPaths);
                        allFills = flattenDexPaths(dexPaths);
                        // If native orders are allowed, splice them in.
                        if (!_opts.excludedSources.includes(types_2.ERC20BridgeSource.Native)) {
                            allPaths.splice(0, 0, nativeFills);
                            allFills.splice.apply(allFills, __spread([0, 0], nativeFills));
                        }
                        optimizer = new fill_optimizer_1.FillsOptimizer(_opts.runLimit);
                        upperBoundPath = pickBestUpperBoundPath(allPaths, takerAmount);
                        optimalPath = optimizer.optimize(
                        // Sorting the orders by price effectively causes the optimizer to walk
                        // the greediest solution first, which is the optimal solution in most
                        // cases.
                        fill_optimizer_1.sortFillsByAdjustedRate(allFills), takerAmount, upperBoundPath);
                        if (!optimalPath) {
                            throw new Error(types_2.AggregationError.NoOptimalPath);
                        }
                        return [2 /*return*/, this._createOrderUtils.createSellOrdersFromPath(this._orderDomain, takerToken, makerToken, collapsePath(optimalPath, false), _opts.bridgeSlippage)];
                }
            });
        });
    };
    /**
     * gets the orders required for a market buy operation by (potentially) merging native orders with
     * generated bridge orders.
     * @param nativeOrders Native orders.
     * @param makerAmount Amount of maker asset to buy.
     * @param opts Options object.
     * @return orders.
     */
    MarketOperationUtils.prototype.getMarketBuyOrdersAsync = function (nativeOrders, makerAmount, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var _opts, _a, makerToken, takerToken, _b, fillableAmounts, ethToTakerAssetRate, dexQuotes, signedOrderWithFillableAmounts;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (nativeOrders.length === 0) {
                            throw new Error(types_2.AggregationError.EmptyOrders);
                        }
                        _opts = __assign({}, DEFAULT_GET_MARKET_ORDERS_OPTS, opts);
                        _a = __read(getOrderTokens(nativeOrders[0]), 2), makerToken = _a[0], takerToken = _a[1];
                        return [4 /*yield*/, this._sampler.executeAsync(sampler_1.DexOrderSampler.ops.getOrderFillableMakerAmounts(nativeOrders), takerToken.toLowerCase() === this._wethAddress.toLowerCase()
                                ? sampler_1.DexOrderSampler.ops.constant(new utils_1.BigNumber(1))
                                : sampler_1.DexOrderSampler.ops.getMedianSellRate(difference(FEE_QUOTE_SOURCES, _opts.excludedSources), takerToken, this._wethAddress, ONE_ETHER), sampler_1.DexOrderSampler.ops.getBuyQuotes(difference(BUY_SOURCES, _opts.excludedSources), makerToken, takerToken, sampler_1.getSampleAmounts(makerAmount, _opts.numSamples, _opts.sampleDistributionBase)))];
                    case 1:
                        _b = __read.apply(void 0, [_c.sent(), 3]), fillableAmounts = _b[0], ethToTakerAssetRate = _b[1], dexQuotes = _b[2];
                        signedOrderWithFillableAmounts = this._createBuyOrdersPathFromSamplerResultIfExists(nativeOrders, makerAmount, fillableAmounts, dexQuotes, ethToTakerAssetRate, _opts);
                        if (!signedOrderWithFillableAmounts) {
                            throw new Error(types_2.AggregationError.NoOptimalPath);
                        }
                        return [2 /*return*/, signedOrderWithFillableAmounts];
                }
            });
        });
    };
    /**
     * gets the orders required for a batch of market buy operations by (potentially) merging native orders with
     * generated bridge orders.
     * @param batchNativeOrders Batch of Native orders.
     * @param makerAmounts Array amount of maker asset to buy for each batch.
     * @param opts Options object.
     * @return orders.
     */
    MarketOperationUtils.prototype.getBatchMarketBuyOrdersAsync = function (batchNativeOrders, makerAmounts, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var _opts, sources, ops, executeResults, batchFillableAmounts, batchEthToTakerAssetRate, batchDexQuotes;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (batchNativeOrders.length === 0) {
                            throw new Error(types_2.AggregationError.EmptyOrders);
                        }
                        _opts = __assign({}, DEFAULT_GET_MARKET_ORDERS_OPTS, opts);
                        sources = difference(BUY_SOURCES, _opts.excludedSources);
                        ops = __spread(batchNativeOrders.map(function (orders) { return sampler_1.DexOrderSampler.ops.getOrderFillableMakerAmounts(orders); }), batchNativeOrders.map(function (orders) {
                            return sampler_1.DexOrderSampler.ops.getMedianSellRate(difference(FEE_QUOTE_SOURCES, _opts.excludedSources), _this._wethAddress, getOrderTokens(orders[0])[1], ONE_ETHER);
                        }), batchNativeOrders.map(function (orders, i) {
                            return sampler_1.DexOrderSampler.ops.getBuyQuotes(sources, getOrderTokens(orders[0])[0], getOrderTokens(orders[0])[1], [
                                makerAmounts[i],
                            ]);
                        }));
                        return [4 /*yield*/, this._sampler.executeBatchAsync(ops)];
                    case 1:
                        executeResults = _a.sent();
                        batchFillableAmounts = executeResults.splice(0, batchNativeOrders.length);
                        batchEthToTakerAssetRate = executeResults.splice(0, batchNativeOrders.length);
                        batchDexQuotes = executeResults.splice(0, batchNativeOrders.length);
                        return [2 /*return*/, batchFillableAmounts.map(function (fillableAmounts, i) {
                                return _this._createBuyOrdersPathFromSamplerResultIfExists(batchNativeOrders[i], makerAmounts[i], fillableAmounts, batchDexQuotes[i], batchEthToTakerAssetRate[i], _opts);
                            })];
                }
            });
        });
    };
    MarketOperationUtils.prototype._createBuyOrdersPathFromSamplerResultIfExists = function (nativeOrders, makerAmount, nativeOrderFillableAmounts, dexQuotes, ethToTakerAssetRate, opts) {
        var nativeOrdersWithFillableAmounts = createSignedOrdersWithFillableAmounts(nativeOrders, nativeOrderFillableAmounts, types_1.MarketOperation.Buy);
        var nativeFills = pruneNativeFills(fill_optimizer_1.sortFillsByAdjustedRate(createBuyPathFromNativeOrders(nativeOrdersWithFillableAmounts, ethToTakerAssetRate, opts), true), makerAmount, opts.dustFractionThreshold);
        var dexPaths = createBuyPathsFromDexQuotes(dexQuotes, ethToTakerAssetRate, opts);
        var allPaths = __spread(dexPaths);
        var allFills = flattenDexPaths(dexPaths);
        // If native orders are allowed, splice them in.
        if (!opts.excludedSources.includes(types_2.ERC20BridgeSource.Native)) {
            allPaths.splice(0, 0, nativeFills);
            allFills.splice.apply(allFills, __spread([0, 0], nativeFills));
        }
        var optimizer = new fill_optimizer_1.FillsOptimizer(opts.runLimit, true);
        var upperBoundPath = pickBestUpperBoundPath(allPaths, makerAmount, true);
        var optimalPath = optimizer.optimize(
        // Sorting the orders by price effectively causes the optimizer to walk
        // the greediest solution first, which is the optimal solution in most
        // cases.
        fill_optimizer_1.sortFillsByAdjustedRate(allFills, true), makerAmount, upperBoundPath);
        if (!optimalPath) {
            return undefined;
        }
        var _a = __read(getOrderTokens(nativeOrders[0]), 2), inputToken = _a[0], outputToken = _a[1];
        return this._createOrderUtils.createBuyOrdersFromPath(this._orderDomain, inputToken, outputToken, collapsePath(optimalPath, true), opts.bridgeSlippage);
    };
    return MarketOperationUtils;
}());
exports.MarketOperationUtils = MarketOperationUtils;
function createSignedOrdersWithFillableAmounts(signedOrders, fillableAmounts, operation) {
    return signedOrders
        .map(function (order, i) {
        var fillableAmount = fillableAmounts[i];
        var fillableMakerAssetAmount = operation === types_1.MarketOperation.Buy
            ? fillableAmount
            : order_utils_1.orderCalculationUtils.getMakerFillAmount(order, fillableAmount);
        var fillableTakerAssetAmount = operation === types_1.MarketOperation.Sell
            ? fillableAmount
            : order_utils_1.orderCalculationUtils.getTakerFillAmount(order, fillableAmount);
        var fillableTakerFeeAmount = order_utils_1.orderCalculationUtils.getTakerFeeAmount(order, fillableTakerAssetAmount);
        return __assign({ fillableMakerAssetAmount: fillableMakerAssetAmount,
            fillableTakerAssetAmount: fillableTakerAssetAmount,
            fillableTakerFeeAmount: fillableTakerFeeAmount }, order);
    })
        .filter(function (order) {
        return !order.fillableMakerAssetAmount.isZero() && !order.fillableTakerAssetAmount.isZero();
    });
}
// Gets the difference between two sets.
function difference(a, b) {
    return a.filter(function (x) { return b.indexOf(x) === -1; });
}
function createSellPathFromNativeOrders(orders, ethToOutputAssetRate, opts) {
    var path = [];
    // tslint:disable-next-line: prefer-for-of
    for (var i = 0; i < orders.length; i++) {
        var order = orders[i];
        var makerAmount = fillable_amounts_utils_1.fillableAmountsUtils.getMakerAssetAmountSwappedAfterOrderFees(order);
        var takerAmount = fillable_amounts_utils_1.fillableAmountsUtils.getTakerAssetAmountSwappedAfterOrderFees(order);
        // Native orders can be filled in any order, so they're all root nodes.
        path.push({
            flags: types_2.FillFlags.SourceNative,
            exclusionMask: 0,
            input: takerAmount,
            output: makerAmount,
            // Every fill from native orders incurs a penalty.
            fillPenalty: ethToOutputAssetRate.times(opts.fees[types_2.ERC20BridgeSource.Native] || 0),
            fillData: {
                source: types_2.ERC20BridgeSource.Native,
                order: order,
            },
        });
    }
    return path;
}
function createBuyPathFromNativeOrders(orders, ethToOutputAssetRate, opts) {
    var path = [];
    // tslint:disable-next-line: prefer-for-of
    for (var i = 0; i < orders.length; i++) {
        var order = orders[i];
        var makerAmount = fillable_amounts_utils_1.fillableAmountsUtils.getMakerAssetAmountSwappedAfterOrderFees(order);
        var takerAmount = fillable_amounts_utils_1.fillableAmountsUtils.getTakerAssetAmountSwappedAfterOrderFees(order);
        // Native orders can be filled in any order, so they're all root nodes.
        path.push({
            flags: types_2.FillFlags.SourceNative,
            exclusionMask: 0,
            input: makerAmount,
            output: takerAmount,
            // Every fill from native orders incurs a penalty.
            // Negated because we try to minimize the output in buys.
            fillPenalty: ethToOutputAssetRate.times(opts.fees[types_2.ERC20BridgeSource.Native] || 0).negated(),
            fillData: {
                source: types_2.ERC20BridgeSource.Native,
                order: order,
            },
        });
    }
    return path;
}
function pruneNativeFills(fills, fillAmount, dustFractionThreshold) {
    var e_1, _a;
    var minInput = fillAmount.times(dustFractionThreshold);
    var pruned = [];
    var totalInput = ZERO_AMOUNT;
    try {
        for (var fills_1 = __values(fills), fills_1_1 = fills_1.next(); !fills_1_1.done; fills_1_1 = fills_1.next()) {
            var fill = fills_1_1.value;
            if (totalInput.gte(fillAmount)) {
                break;
            }
            if (fill.input.lt(minInput)) {
                continue;
            }
            totalInput = totalInput.plus(fill.input);
            pruned.push(fill);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (fills_1_1 && !fills_1_1.done && (_a = fills_1.return)) _a.call(fills_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return pruned;
}
function createSellPathsFromDexQuotes(dexQuotes, ethToOutputAssetRate, opts) {
    return createPathsFromDexQuotes(dexQuotes, ethToOutputAssetRate, opts);
}
function createBuyPathsFromDexQuotes(dexQuotes, ethToOutputAssetRate, opts) {
    return createPathsFromDexQuotes(dexQuotes, 
    // Negated because we try to minimize the output in buys.
    ethToOutputAssetRate.negated(), opts);
}
function createPathsFromDexQuotes(dexQuotes, ethToOutputAssetRate, opts) {
    var e_2, _a;
    var paths = [];
    try {
        for (var dexQuotes_1 = __values(dexQuotes), dexQuotes_1_1 = dexQuotes_1.next(); !dexQuotes_1_1.done; dexQuotes_1_1 = dexQuotes_1.next()) {
            var quote = dexQuotes_1_1.value;
            var path = [];
            var prevSample = void 0;
            // tslint:disable-next-line: prefer-for-of
            for (var i = 0; i < quote.length; i++) {
                var sample = quote[i];
                // Stop of the sample has zero output, which can occur if the source
                // cannot fill the full amount.
                if (sample.output.isZero()) {
                    break;
                }
                path.push({
                    input: sample.input.minus(prevSample ? prevSample.input : 0),
                    output: sample.output.minus(prevSample ? prevSample.output : 0),
                    fillPenalty: ZERO_AMOUNT,
                    parent: path.length !== 0 ? path[path.length - 1] : undefined,
                    flags: sourceToFillFlags(sample.source),
                    exclusionMask: opts.noConflicts ? sourceToExclusionMask(sample.source) : 0,
                    fillData: { source: sample.source },
                });
                prevSample = quote[i];
            }
            // Don't push empty paths.
            if (path.length > 0) {
                // Only the first fill in a DEX path incurs a penalty.
                path[0].fillPenalty = ethToOutputAssetRate.times(opts.fees[path[0].fillData.source] || 0);
                paths.push(path);
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (dexQuotes_1_1 && !dexQuotes_1_1.done && (_a = dexQuotes_1.return)) _a.call(dexQuotes_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return paths;
}
function sourceToFillFlags(source) {
    if (source === types_2.ERC20BridgeSource.Kyber) {
        return types_2.FillFlags.SourceKyber;
    }
    if (source === types_2.ERC20BridgeSource.Eth2Dai) {
        return types_2.FillFlags.SourceEth2Dai;
    }
    if (source === types_2.ERC20BridgeSource.Uniswap) {
        return types_2.FillFlags.SourceUniswap;
    }
    return types_2.FillFlags.SourceNative;
}
function sourceToExclusionMask(source) {
    if (source === types_2.ERC20BridgeSource.Kyber) {
        // tslint:disable-next-line: no-bitwise
        return types_2.FillFlags.SourceEth2Dai | types_2.FillFlags.SourceUniswap;
    }
    if (source === types_2.ERC20BridgeSource.Eth2Dai) {
        return types_2.FillFlags.SourceKyber;
    }
    if (source === types_2.ERC20BridgeSource.Uniswap) {
        return types_2.FillFlags.SourceKyber;
    }
    return 0;
}
// Convert a list of DEX paths to a flattened list of `Fills`.
function flattenDexPaths(dexFills) {
    var e_3, _a, e_4, _b;
    var fills = [];
    try {
        for (var dexFills_1 = __values(dexFills), dexFills_1_1 = dexFills_1.next(); !dexFills_1_1.done; dexFills_1_1 = dexFills_1.next()) {
            var quote = dexFills_1_1.value;
            try {
                for (var quote_1 = __values(quote), quote_1_1 = quote_1.next(); !quote_1_1.done; quote_1_1 = quote_1.next()) {
                    var fill = quote_1_1.value;
                    fills.push(fill);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (quote_1_1 && !quote_1_1.done && (_b = quote_1.return)) _b.call(quote_1);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (dexFills_1_1 && !dexFills_1_1.done && (_a = dexFills_1.return)) _a.call(dexFills_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return fills;
}
// Picks the path with the highest (or lowest if `shouldMinimize` is true) output.
function pickBestUpperBoundPath(paths, maxInput, shouldMinimize) {
    var e_5, _a;
    var optimalPath;
    var optimalPathOutput = ZERO_AMOUNT;
    try {
        for (var paths_1 = __values(paths), paths_1_1 = paths_1.next(); !paths_1_1.done; paths_1_1 = paths_1.next()) {
            var path = paths_1_1.value;
            if (getPathInput(path).gte(maxInput)) {
                var output = fill_optimizer_1.getPathAdjustedOutput(path, maxInput);
                if (!optimalPath || fill_optimizer_1.comparePathOutputs(output, optimalPathOutput, !!shouldMinimize) === 1) {
                    optimalPath = path;
                    optimalPathOutput = output;
                }
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (paths_1_1 && !paths_1_1.done && (_a = paths_1.return)) _a.call(paths_1);
        }
        finally { if (e_5) throw e_5.error; }
    }
    return optimalPath;
}
// Gets the total input of a path.
function getPathInput(path) {
    return utils_1.BigNumber.sum.apply(utils_1.BigNumber, __spread(path.map(function (p) { return p.input; })));
}
// Merges contiguous fills from the same DEX.
function collapsePath(path, isBuy) {
    var e_6, _a;
    var collapsed = [];
    try {
        for (var path_1 = __values(path), path_1_1 = path_1.next(); !path_1_1.done; path_1_1 = path_1.next()) {
            var fill = path_1_1.value;
            var makerAssetAmount = isBuy ? fill.input : fill.output;
            var takerAssetAmount = isBuy ? fill.output : fill.input;
            var source = fill.fillData.source;
            if (collapsed.length !== 0 && source !== types_2.ERC20BridgeSource.Native) {
                var prevFill = collapsed[collapsed.length - 1];
                // If the last fill is from the same source, merge them.
                if (prevFill.source === source) {
                    prevFill.totalMakerAssetAmount = prevFill.totalMakerAssetAmount.plus(makerAssetAmount);
                    prevFill.totalTakerAssetAmount = prevFill.totalTakerAssetAmount.plus(takerAssetAmount);
                    prevFill.subFills.push({ makerAssetAmount: makerAssetAmount, takerAssetAmount: takerAssetAmount });
                    continue;
                }
            }
            collapsed.push({
                source: fill.fillData.source,
                totalMakerAssetAmount: makerAssetAmount,
                totalTakerAssetAmount: takerAssetAmount,
                subFills: [{ makerAssetAmount: makerAssetAmount, takerAssetAmount: takerAssetAmount }],
                nativeOrder: fill.fillData.order,
            });
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (path_1_1 && !path_1_1.done && (_a = path_1.return)) _a.call(path_1);
        }
        finally { if (e_6) throw e_6.error; }
    }
    return collapsed;
}
function getOrderTokens(order) {
    var assets = [order.makerAssetData, order.takerAssetData].map(function (a) { return order_utils_1.assetDataUtils.decodeAssetDataOrThrow(a); });
    if (assets.some(function (a) { return a.assetProxyId !== ERC20_PROXY_ID; })) {
        throw new Error(types_2.AggregationError.NotERC20AssetData);
    }
    return assets.map(function (a) { return a.tokenAddress; });
}
// tslint:disable: max-file-line-count
//# sourceMappingURL=index.js.map