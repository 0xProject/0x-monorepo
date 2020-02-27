"use strict";
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
var contract_addresses_1 = require("@0x/contract-addresses");
var contract_wrappers_1 = require("@0x/contract-wrappers");
var json_schemas_1 = require("@0x/json-schemas");
var order_utils_1 = require("@0x/order-utils");
var orderbook_1 = require("@0x/orderbook");
var utils_1 = require("@0x/utils");
var _ = require("lodash");
var constants_1 = require("./constants");
var types_1 = require("./types");
var assert_1 = require("./utils/assert");
var calculate_liquidity_1 = require("./utils/calculate_liquidity");
var market_operation_utils_1 = require("./utils/market_operation_utils");
var dummy_order_utils_1 = require("./utils/market_operation_utils/dummy_order_utils");
var order_prune_utils_1 = require("./utils/order_prune_utils");
var order_state_utils_1 = require("./utils/order_state_utils");
var protocol_fee_utils_1 = require("./utils/protocol_fee_utils");
var sorting_utils_1 = require("./utils/sorting_utils");
var swap_quote_calculator_1 = require("./utils/swap_quote_calculator");
var SwapQuoter = /** @class */ (function () {
    /**
     * Instantiates a new SwapQuoter instance
     * @param   supportedProvider   The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orderbook           An object that conforms to Orderbook, see type for definition.
     * @param   options             Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    function SwapQuoter(supportedProvider, orderbook, options) {
        if (options === void 0) { options = {}; }
        var _a = _.merge({}, constants_1.constants.DEFAULT_SWAP_QUOTER_OPTS, options), chainId = _a.chainId, expiryBufferMs = _a.expiryBufferMs, permittedOrderFeeTypes = _a.permittedOrderFeeTypes, samplerGasLimit = _a.samplerGasLimit;
        var provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
        assert_1.assert.isValidOrderbook('orderbook', orderbook);
        assert_1.assert.isNumber('chainId', chainId);
        assert_1.assert.isNumber('expiryBufferMs', expiryBufferMs);
        this.chainId = chainId;
        this.provider = provider;
        this.orderbook = orderbook;
        this.expiryBufferMs = expiryBufferMs;
        this.permittedOrderFeeTypes = permittedOrderFeeTypes;
        this._contractAddresses = options.contractAddresses || contract_addresses_1.getContractAddressesForChainOrThrow(chainId);
        this._devUtilsContract = new contract_wrappers_1.DevUtilsContract(this._contractAddresses.devUtils, provider);
        this._protocolFeeUtils = new protocol_fee_utils_1.ProtocolFeeUtils(constants_1.constants.PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS);
        this._orderStateUtils = new order_state_utils_1.OrderStateUtils(this._devUtilsContract);
        var sampler = new market_operation_utils_1.DexOrderSampler(new contract_wrappers_1.IERC20BridgeSamplerContract(this._contractAddresses.erc20BridgeSampler, this.provider, {
            gas: samplerGasLimit,
        }));
        this._marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(sampler, this._contractAddresses, {
            chainId: chainId,
            exchangeAddress: this._contractAddresses.exchange,
        });
        this._swapQuoteCalculator = new swap_quote_calculator_1.SwapQuoteCalculator(this._protocolFeeUtils, this._marketOperationUtils);
    }
    /**
     * Instantiates a new SwapQuoter instance given existing liquidity in the form of orders and feeOrders.
     * @param   supportedProvider   The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orders              A non-empty array of objects that conform to SignedOrder. All orders must have the same makerAssetData and takerAssetData.
     * @param   options             Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    SwapQuoter.getSwapQuoterForProvidedOrders = function (supportedProvider, orders, options) {
        if (options === void 0) { options = {}; }
        assert_1.assert.doesConformToSchema('orders', orders, json_schemas_1.schemas.signedOrdersSchema);
        assert_1.assert.assert(orders.length !== 0, "Expected orders to contain at least one order");
        var orderbook = orderbook_1.Orderbook.getOrderbookForProvidedOrders(orders);
        var swapQuoter = new SwapQuoter(supportedProvider, orderbook, options);
        return swapQuoter;
    };
    /**
     * Instantiates a new SwapQuoter instance given a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint
     * @param   supportedProvider  The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   sraApiUrl          The standard relayer API base HTTP url you would like to source orders from.
     * @param   options            Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl = function (supportedProvider, sraApiUrl, options) {
        if (options === void 0) { options = {}; }
        var provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
        assert_1.assert.isWebUri('sraApiUrl', sraApiUrl);
        var orderbook = orderbook_1.Orderbook.getOrderbookForPollingProvider({
            httpEndpoint: sraApiUrl,
            pollingIntervalMs: options.orderRefreshIntervalMs || constants_1.constants.DEFAULT_SWAP_QUOTER_OPTS.orderRefreshIntervalMs,
            perPage: options.perPage || constants_1.constants.DEFAULT_PER_PAGE,
        });
        var swapQuoter = new SwapQuoter(provider, orderbook, options);
        return swapQuoter;
    };
    /**
     * Instantiates a new SwapQuoter instance given a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint
     * and a websocket endpoint. This is more effecient than `getSwapQuoterForStandardRelayerAPIUrl` when requesting multiple quotes.
     * @param   supportedProvider    The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   sraApiUrl            The standard relayer API base HTTP url you would like to source orders from.
     * @param   sraWebsocketApiUrl   The standard relayer API Websocket url you would like to subscribe to.
     * @param   options              Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    SwapQuoter.getSwapQuoterForStandardRelayerAPIWebsocket = function (supportedProvider, sraApiUrl, sraWebsocketAPIUrl, options) {
        if (options === void 0) { options = {}; }
        var provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
        assert_1.assert.isWebUri('sraApiUrl', sraApiUrl);
        assert_1.assert.isUri('sraWebsocketAPIUrl', sraWebsocketAPIUrl);
        var orderbook = orderbook_1.Orderbook.getOrderbookForWebsocketProvider({
            httpEndpoint: sraApiUrl,
            websocketEndpoint: sraWebsocketAPIUrl,
        });
        var swapQuoter = new SwapQuoter(provider, orderbook, options);
        return swapQuoter;
    };
    /**
     * Instantiates a new SwapQuoter instance given a 0x Mesh endpoint. This pulls all available liquidity stored in Mesh
     * @param   supportedProvider The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   meshEndpoint      The standard relayer API base HTTP url you would like to source orders from.
     * @param   options           Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    SwapQuoter.getSwapQuoterForMeshEndpoint = function (supportedProvider, meshEndpoint, options) {
        if (options === void 0) { options = {}; }
        var provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
        assert_1.assert.isUri('meshEndpoint', meshEndpoint);
        var orderbook = orderbook_1.Orderbook.getOrderbookForMeshProvider({
            websocketEndpoint: meshEndpoint,
            wsOpts: options.wsOpts,
        });
        var swapQuoter = new SwapQuoter(provider, orderbook, options);
        return swapQuoter;
    };
    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.
     * @param   makerAssetData           The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData           The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetSellAmount     The amount of taker asset to swap for.
     * @param   options                  Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    SwapQuoter.prototype.getMarketSellSwapQuoteForAssetDataAsync = function (makerAssetData, takerAssetData, takerAssetSellAmount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert_1.assert.isBigNumber('takerAssetSellAmount', takerAssetSellAmount);
                        return [4 /*yield*/, this._getSwapQuoteAsync(makerAssetData, takerAssetData, takerAssetSellAmount, types_1.MarketOperation.Sell, options)];
                    case 1: return [2 /*return*/, (_a.sent())];
                }
            });
        });
    };
    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.
     * @param   makerAssetData           The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData           The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   makerAssetBuyAmount     The amount of maker asset to swap for.
     * @param   options                  Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    SwapQuoter.prototype.getMarketBuySwapQuoteForAssetDataAsync = function (makerAssetData, takerAssetData, makerAssetBuyAmount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert_1.assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
                        return [4 /*yield*/, this._getSwapQuoteAsync(makerAssetData, takerAssetData, makerAssetBuyAmount, types_1.MarketOperation.Buy, options)];
                    case 1: return [2 /*return*/, (_a.sent())];
                }
            });
        });
    };
    SwapQuoter.prototype.getBatchMarketBuySwapQuoteForAssetDataAsync = function (makerAssetDatas, takerAssetData, makerAssetBuyAmount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var gasPrice, _a, slippagePercentage, calculateSwapQuoteOpts, apiOrders, allOrders, allPrunedOrders, swapQuotes;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        makerAssetBuyAmount.map(function (a, i) { return assert_1.assert.isBigNumber("makerAssetBuyAmount[" + i + "]", a); });
                        _a = _.merge({}, constants_1.constants.DEFAULT_SWAP_QUOTE_REQUEST_OPTS, options), slippagePercentage = _a.slippagePercentage, calculateSwapQuoteOpts = __rest(_a, ["slippagePercentage"]);
                        if (!!!options.gasPrice) return [3 /*break*/, 1];
                        gasPrice = options.gasPrice;
                        assert_1.assert.isBigNumber('gasPrice', gasPrice);
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this._protocolFeeUtils.getGasPriceEstimationOrThrowAsync()];
                    case 2:
                        gasPrice = _b.sent();
                        _b.label = 3;
                    case 3: return [4 /*yield*/, this.orderbook.getBatchOrdersAsync(makerAssetDatas, [takerAssetData])];
                    case 4:
                        apiOrders = _b.sent();
                        allOrders = apiOrders.map(function (orders) { return orders.map(function (o) { return o.order; }); });
                        allPrunedOrders = allOrders.map(function (orders, i) {
                            var prunedOrders = order_prune_utils_1.orderPrunerUtils.pruneForUsableSignedOrders(orders, _this.permittedOrderFeeTypes, _this.expiryBufferMs);
                            if (prunedOrders.length === 0) {
                                return [
                                    dummy_order_utils_1.dummyOrderUtils.createDummyOrderForSampler(makerAssetDatas[i], takerAssetData, _this._contractAddresses.uniswapBridge),
                                ];
                            }
                            else {
                                return sorting_utils_1.sortingUtils.sortOrders(prunedOrders);
                            }
                        });
                        return [4 /*yield*/, this._swapQuoteCalculator.calculateBatchMarketBuySwapQuoteAsync(allPrunedOrders, makerAssetBuyAmount, slippagePercentage, gasPrice, calculateSwapQuoteOpts)];
                    case 5:
                        swapQuotes = _b.sent();
                        return [2 /*return*/, swapQuotes];
                }
            });
        });
    };
    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.
     * @param   makerTokenAddress       The address of the maker asset
     * @param   takerTokenAddress       The address of the taker asset
     * @param   makerAssetBuyAmount     The amount of maker asset to swap for.
     * @param   options                 Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    SwapQuoter.prototype.getMarketBuySwapQuoteAsync = function (makerTokenAddress, takerTokenAddress, makerAssetBuyAmount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var makerAssetData, takerAssetData, swapQuote;
            return __generator(this, function (_a) {
                assert_1.assert.isETHAddressHex('makerTokenAddress', makerTokenAddress);
                assert_1.assert.isETHAddressHex('takerTokenAddress', takerTokenAddress);
                assert_1.assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
                makerAssetData = order_utils_1.assetDataUtils.encodeERC20AssetData(makerTokenAddress);
                takerAssetData = order_utils_1.assetDataUtils.encodeERC20AssetData(takerTokenAddress);
                swapQuote = this.getMarketBuySwapQuoteForAssetDataAsync(makerAssetData, takerAssetData, makerAssetBuyAmount, options);
                return [2 /*return*/, swapQuote];
            });
        });
    };
    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.
     * @param   makerTokenAddress       The address of the maker asset
     * @param   takerTokenAddress       The address of the taker asset
     * @param   takerAssetSellAmount     The amount of taker asset to sell.
     * @param   options                  Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    SwapQuoter.prototype.getMarketSellSwapQuoteAsync = function (makerTokenAddress, takerTokenAddress, takerAssetSellAmount, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var makerAssetData, takerAssetData, swapQuote;
            return __generator(this, function (_a) {
                assert_1.assert.isETHAddressHex('makerTokenAddress', makerTokenAddress);
                assert_1.assert.isETHAddressHex('takerTokenAddress', takerTokenAddress);
                assert_1.assert.isBigNumber('takerAssetSellAmount', takerAssetSellAmount);
                makerAssetData = order_utils_1.assetDataUtils.encodeERC20AssetData(makerTokenAddress);
                takerAssetData = order_utils_1.assetDataUtils.encodeERC20AssetData(takerTokenAddress);
                swapQuote = this.getMarketSellSwapQuoteForAssetDataAsync(makerAssetData, takerAssetData, takerAssetSellAmount, options);
                return [2 /*return*/, swapQuote];
            });
        });
    };
    /**
     * Returns information about available liquidity for an asset
     * Does not factor in slippage or fees
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     *
     * @return  An object that conforms to LiquidityForTakerMakerAssetDataPair that satisfies the request. See type definition for more information.
     */
    SwapQuoter.prototype.getLiquidityForMakerTakerAssetDataPairAsync = function (makerAssetData, takerAssetData) {
        return __awaiter(this, void 0, void 0, function () {
            var assetPairs, ordersWithFillableAmounts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert_1.assert.isString('makerAssetData', makerAssetData);
                        assert_1.assert.isString('takerAssetData', takerAssetData);
                        order_utils_1.assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
                        order_utils_1.assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
                        return [4 /*yield*/, this.getAvailableMakerAssetDatasAsync(takerAssetData)];
                    case 1:
                        assetPairs = _a.sent();
                        if (!assetPairs.includes(makerAssetData)) {
                            return [2 /*return*/, {
                                    makerAssetAvailableInBaseUnits: new utils_1.BigNumber(0),
                                    takerAssetAvailableInBaseUnits: new utils_1.BigNumber(0),
                                }];
                        }
                        return [4 /*yield*/, this.getSignedOrdersWithFillableAmountsAsync(makerAssetData, takerAssetData)];
                    case 2:
                        ordersWithFillableAmounts = _a.sent();
                        return [2 /*return*/, calculate_liquidity_1.calculateLiquidity(ordersWithFillableAmounts)];
                }
            });
        });
    };
    /**
     * Get the asset data of all assets that can be used to purchase makerAssetData in the order provider passed in at init.
     *
     * @return  An array of asset data strings that can purchase makerAssetData.
     */
    SwapQuoter.prototype.getAvailableTakerAssetDatasAsync = function (makerAssetData) {
        return __awaiter(this, void 0, void 0, function () {
            var allAssetPairs, assetPairs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert_1.assert.isString('makerAssetData', makerAssetData);
                        order_utils_1.assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
                        return [4 /*yield*/, this.orderbook.getAvailableAssetDatasAsync()];
                    case 1:
                        allAssetPairs = _a.sent();
                        assetPairs = allAssetPairs
                            .filter(function (pair) { return pair.assetDataA.assetData === makerAssetData; })
                            .map(function (pair) { return pair.assetDataB.assetData; });
                        return [2 /*return*/, assetPairs];
                }
            });
        });
    };
    /**
     * Get the asset data of all assets that are purchaseable with takerAssetData in the order provider passed in at init.
     *
     * @return  An array of asset data strings that are purchaseable with takerAssetData.
     */
    SwapQuoter.prototype.getAvailableMakerAssetDatasAsync = function (takerAssetData) {
        return __awaiter(this, void 0, void 0, function () {
            var allAssetPairs, assetPairs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert_1.assert.isString('takerAssetData', takerAssetData);
                        order_utils_1.assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
                        return [4 /*yield*/, this.orderbook.getAvailableAssetDatasAsync()];
                    case 1:
                        allAssetPairs = _a.sent();
                        assetPairs = allAssetPairs
                            .filter(function (pair) { return pair.assetDataB.assetData === takerAssetData; })
                            .map(function (pair) { return pair.assetDataA.assetData; });
                        return [2 /*return*/, assetPairs];
                }
            });
        });
    };
    /**
     * Validates the taker + maker asset pair is available from the order provider provided to `SwapQuote`.
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     *
     * @return  A boolean on if the taker, maker pair exists
     */
    SwapQuoter.prototype.isTakerMakerAssetDataPairAvailableAsync = function (makerAssetData, takerAssetData) {
        return __awaiter(this, void 0, void 0, function () {
            var availableMakerAssetDatas;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert_1.assert.isString('makerAssetData', makerAssetData);
                        assert_1.assert.isString('takerAssetData', takerAssetData);
                        order_utils_1.assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
                        order_utils_1.assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
                        return [4 /*yield*/, this.getAvailableMakerAssetDatasAsync(takerAssetData)];
                    case 1:
                        availableMakerAssetDatas = _a.sent();
                        return [2 /*return*/, _.includes(availableMakerAssetDatas, makerAssetData)];
                }
            });
        });
    };
    /**
     * Grab orders from the order provider, prunes for valid orders with provided OrderPruner options
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     */
    SwapQuoter.prototype.getSignedOrdersWithFillableAmountsAsync = function (makerAssetData, takerAssetData) {
        return __awaiter(this, void 0, void 0, function () {
            var apiOrders, orders, prunedOrders, sortedPrunedOrders, ordersWithFillableAmounts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert_1.assert.isString('makerAssetData', makerAssetData);
                        assert_1.assert.isString('takerAssetData', takerAssetData);
                        order_utils_1.assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
                        order_utils_1.assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
                        return [4 /*yield*/, this.orderbook.getOrdersAsync(makerAssetData, takerAssetData)];
                    case 1:
                        apiOrders = _a.sent();
                        orders = _.map(apiOrders, function (o) { return o.order; });
                        prunedOrders = order_prune_utils_1.orderPrunerUtils.pruneForUsableSignedOrders(orders, this.permittedOrderFeeTypes, this.expiryBufferMs);
                        sortedPrunedOrders = sorting_utils_1.sortingUtils.sortOrders(prunedOrders);
                        return [4 /*yield*/, this._orderStateUtils.getSignedOrdersWithFillableAmountsAsync(sortedPrunedOrders)];
                    case 2:
                        ordersWithFillableAmounts = _a.sent();
                        return [2 /*return*/, ordersWithFillableAmounts];
                }
            });
        });
    };
    /**
     * Util function to check if takerAddress's allowance is enough for 0x exchange contracts to conduct the swap specified by the swapQuote.
     * @param swapQuote The swapQuote in question to check enough allowance enabled for 0x exchange contracts to conduct the swap.
     * @param takerAddress The address of the taker of the provided swapQuote
     */
    SwapQuoter.prototype.isSwapQuoteFillableByTakerAddressAsync = function (swapQuote, takerAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var balanceAndAllowance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._devUtilsContract
                            .getBalanceAndAssetProxyAllowance(takerAddress, swapQuote.takerAssetData)
                            .callAsync()];
                    case 1:
                        balanceAndAllowance = _a.sent();
                        return [2 /*return*/, [
                                balanceAndAllowance[1].isGreaterThanOrEqualTo(swapQuote.bestCaseQuoteInfo.totalTakerAssetAmount),
                                balanceAndAllowance[1].isGreaterThanOrEqualTo(swapQuote.worstCaseQuoteInfo.totalTakerAssetAmount),
                            ]];
                }
            });
        });
    };
    /**
     * Destroys any subscriptions or connections.
     */
    SwapQuoter.prototype.destroyAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._protocolFeeUtils.destroyAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.orderbook.destroyAsync()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Utility function to get assetData for Ether token.
     */
    SwapQuoter.prototype.getEtherTokenAssetDataOrThrowAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, order_utils_1.assetDataUtils.encodeERC20AssetData(this._contractAddresses.etherToken)];
            });
        });
    };
    /**
     * Grab orders from the order provider, prunes for valid orders with provided OrderPruner options
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     */
    SwapQuoter.prototype._getSignedOrdersAsync = function (makerAssetData, takerAssetData) {
        return __awaiter(this, void 0, void 0, function () {
            var apiOrders, orders, prunedOrders, sortedPrunedOrders;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert_1.assert.isString('makerAssetData', makerAssetData);
                        assert_1.assert.isString('takerAssetData', takerAssetData);
                        order_utils_1.assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
                        order_utils_1.assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
                        return [4 /*yield*/, this.orderbook.getOrdersAsync(makerAssetData, takerAssetData)];
                    case 1:
                        apiOrders = _a.sent();
                        orders = _.map(apiOrders, function (o) { return o.order; });
                        prunedOrders = order_prune_utils_1.orderPrunerUtils.pruneForUsableSignedOrders(orders, this.permittedOrderFeeTypes, this.expiryBufferMs);
                        sortedPrunedOrders = sorting_utils_1.sortingUtils.sortOrders(prunedOrders);
                        return [2 /*return*/, sortedPrunedOrders];
                }
            });
        });
    };
    /**
     * General function for getting swap quote, conditionally uses different logic per specified marketOperation
     */
    SwapQuoter.prototype._getSwapQuoteAsync = function (makerAssetData, takerAssetData, assetFillAmount, marketOperation, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, slippagePercentage, calculateSwapQuoteOpts, gasPrice, prunedOrders, swapQuote;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = _.merge({}, constants_1.constants.DEFAULT_SWAP_QUOTE_REQUEST_OPTS, options), slippagePercentage = _a.slippagePercentage, calculateSwapQuoteOpts = __rest(_a, ["slippagePercentage"]);
                        assert_1.assert.isString('makerAssetData', makerAssetData);
                        assert_1.assert.isString('takerAssetData', takerAssetData);
                        assert_1.assert.isNumber('slippagePercentage', slippagePercentage);
                        if (!!!options.gasPrice) return [3 /*break*/, 1];
                        gasPrice = options.gasPrice;
                        assert_1.assert.isBigNumber('gasPrice', gasPrice);
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this._protocolFeeUtils.getGasPriceEstimationOrThrowAsync()];
                    case 2:
                        gasPrice = _b.sent();
                        _b.label = 3;
                    case 3: return [4 /*yield*/, this._getSignedOrdersAsync(makerAssetData, takerAssetData)];
                    case 4:
                        prunedOrders = _b.sent();
                        // if no native orders, pass in a dummy order for the sampler to have required metadata for sampling
                        if (prunedOrders.length === 0) {
                            prunedOrders = [
                                dummy_order_utils_1.dummyOrderUtils.createDummyOrderForSampler(makerAssetData, takerAssetData, this._contractAddresses.uniswapBridge),
                            ];
                        }
                        if (!(marketOperation === types_1.MarketOperation.Buy)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this._swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(prunedOrders, assetFillAmount, slippagePercentage, gasPrice, calculateSwapQuoteOpts)];
                    case 5:
                        swapQuote = _b.sent();
                        return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, this._swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(prunedOrders, assetFillAmount, slippagePercentage, gasPrice, calculateSwapQuoteOpts)];
                    case 7:
                        swapQuote = _b.sent();
                        _b.label = 8;
                    case 8: return [2 /*return*/, swapQuote];
                }
            });
        });
    };
    return SwapQuoter;
}());
exports.SwapQuoter = SwapQuoter;
// tslint:disable-next-line: max-file-line-count
//# sourceMappingURL=swap_quoter.js.map