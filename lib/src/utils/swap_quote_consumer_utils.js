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
Object.defineProperty(exports, "__esModule", { value: true });
var contract_wrappers_1 = require("@0x/contract-wrappers");
var order_utils_1 = require("@0x/order-utils");
var web3_wrapper_1 = require("@0x/web3-wrapper");
var _ = require("lodash");
var constants_1 = require("../constants");
var types_1 = require("../types");
var utils_1 = require("../utils/utils");
var assert_1 = require("./assert");
exports.swapQuoteConsumerUtils = {
    getTakerAddressOrThrowAsync: function (provider, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var takerAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.swapQuoteConsumerUtils.getTakerAddressAsync(provider, opts)];
                    case 1:
                        takerAddress = _a.sent();
                        if (takerAddress === undefined) {
                            throw new Error(types_1.SwapQuoteConsumerError.NoAddressAvailable);
                        }
                        else {
                            return [2 /*return*/, takerAddress];
                        }
                        return [2 /*return*/];
                }
            });
        });
    },
    getTakerAddressAsync: function (provider, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var web3Wrapper, availableAddresses, firstAvailableAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(opts.takerAddress !== undefined)) return [3 /*break*/, 1];
                        return [2 /*return*/, opts.takerAddress];
                    case 1:
                        web3Wrapper = new web3_wrapper_1.Web3Wrapper(provider);
                        return [4 /*yield*/, web3Wrapper.getAvailableAddressesAsync()];
                    case 2:
                        availableAddresses = _a.sent();
                        firstAvailableAddress = _.head(availableAddresses);
                        if (firstAvailableAddress !== undefined) {
                            return [2 /*return*/, firstAvailableAddress];
                        }
                        else {
                            return [2 /*return*/, undefined];
                        }
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    getEthAndWethBalanceAsync: function (provider, contractAddresses, takerAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var weth, web3Wrapper, ethBalance, wethBalance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        weth = new contract_wrappers_1.WETH9Contract(contractAddresses.etherToken, provider);
                        web3Wrapper = new web3_wrapper_1.Web3Wrapper(provider);
                        return [4 /*yield*/, web3Wrapper.getBalanceInWeiAsync(takerAddress)];
                    case 1:
                        ethBalance = _a.sent();
                        return [4 /*yield*/, weth.balanceOf(takerAddress).callAsync()];
                    case 2:
                        wethBalance = _a.sent();
                        return [2 /*return*/, [ethBalance, wethBalance]];
                }
            });
        });
    },
    isValidForwarderSwapQuote: function (swapQuote, wethAssetData) {
        return exports.swapQuoteConsumerUtils.isValidForwarderSignedOrders(swapQuote.orders, wethAssetData);
    },
    isValidForwarderSignedOrders: function (orders, wethAssetData) {
        return _.every(orders, function (order) { return exports.swapQuoteConsumerUtils.isValidForwarderSignedOrder(order, wethAssetData); });
    },
    isValidForwarderSignedOrder: function (order, wethAssetData) {
        return utils_1.utils.isExactAssetData(order.takerAssetData, wethAssetData);
    },
    getExtensionContractTypeForSwapQuoteAsync: function (quote, contractAddresses, provider, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var wethAssetData, ethAmount_1, takerAddress, takerEthAndWethBalance, _a, isEnoughEthAndWethBalance;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        wethAssetData = order_utils_1.assetDataUtils.encodeERC20AssetData(contractAddresses.etherToken);
                        if (!exports.swapQuoteConsumerUtils.isValidForwarderSwapQuote(quote, wethAssetData)) return [3 /*break*/, 5];
                        if (opts.takerAddress !== undefined) {
                            assert_1.assert.isETHAddressHex('takerAddress', opts.takerAddress);
                        }
                        ethAmount_1 = opts.ethAmount ||
                            quote.worstCaseQuoteInfo.takerAssetAmount.plus(quote.worstCaseQuoteInfo.protocolFeeInWeiAmount);
                        return [4 /*yield*/, exports.swapQuoteConsumerUtils.getTakerAddressAsync(provider, opts)];
                    case 1:
                        takerAddress = _b.sent();
                        if (!(takerAddress !== undefined)) return [3 /*break*/, 3];
                        return [4 /*yield*/, exports.swapQuoteConsumerUtils.getEthAndWethBalanceAsync(provider, contractAddresses, takerAddress)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = [constants_1.constants.ZERO_AMOUNT, constants_1.constants.ZERO_AMOUNT];
                        _b.label = 4;
                    case 4:
                        takerEthAndWethBalance = _a;
                        isEnoughEthAndWethBalance = _.map(takerEthAndWethBalance, function (balance) {
                            return balance.isGreaterThanOrEqualTo(ethAmount_1);
                        });
                        if (isEnoughEthAndWethBalance[1]) {
                            // should be more gas efficient to use exchange consumer, so if possible use it.
                            return [2 /*return*/, types_1.ExtensionContractType.None];
                        }
                        else if (isEnoughEthAndWethBalance[0] && !isEnoughEthAndWethBalance[1]) {
                            return [2 /*return*/, types_1.ExtensionContractType.Forwarder];
                        }
                        // Note: defaulting to forwarderConsumer if takerAddress is null or not enough balance of either wEth or Eth
                        return [2 /*return*/, types_1.ExtensionContractType.Forwarder];
                    case 5: return [2 /*return*/, types_1.ExtensionContractType.None];
                }
            });
        });
    },
};
//# sourceMappingURL=swap_quote_consumer_utils.js.map