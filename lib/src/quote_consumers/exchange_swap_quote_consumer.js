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
var utils_1 = require("@0x/utils");
var _ = require("lodash");
var constants_1 = require("../constants");
var types_1 = require("../types");
var assert_1 = require("../utils/assert");
var swap_quote_consumer_utils_1 = require("../utils/swap_quote_consumer_utils");
var ExchangeSwapQuoteConsumer = /** @class */ (function () {
    function ExchangeSwapQuoteConsumer(supportedProvider, contractAddresses, options) {
        if (options === void 0) { options = {}; }
        var chainId = _.merge({}, constants_1.constants.DEFAULT_SWAP_QUOTER_OPTS, options).chainId;
        assert_1.assert.isNumber('chainId', chainId);
        var provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.chainId = chainId;
        this._exchangeContract = new contract_wrappers_1.ExchangeContract(contractAddresses.exchange, supportedProvider);
    }
    ExchangeSwapQuoteConsumer.prototype.getCalldataOrThrowAsync = function (quote, _opts) {
        if (_opts === void 0) { _opts = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var orders, signatures, calldataHexString;
            return __generator(this, function (_a) {
                assert_1.assert.isValidSwapQuote('quote', quote);
                orders = quote.orders;
                signatures = _.map(orders, function (o) { return o.signature; });
                if (quote.type === types_1.MarketOperation.Buy) {
                    calldataHexString = this._exchangeContract
                        .marketBuyOrdersFillOrKill(orders, quote.makerAssetFillAmount, signatures)
                        .getABIEncodedTransactionData();
                }
                else {
                    calldataHexString = this._exchangeContract
                        .marketSellOrdersFillOrKill(orders, quote.takerAssetFillAmount, signatures)
                        .getABIEncodedTransactionData();
                }
                return [2 /*return*/, {
                        calldataHexString: calldataHexString,
                        ethAmount: quote.worstCaseQuoteInfo.protocolFeeInWeiAmount,
                        toAddress: this._exchangeContract.address,
                    }];
            });
        });
    };
    ExchangeSwapQuoteConsumer.prototype.executeSwapQuoteOrThrowAsync = function (quote, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var takerAddress, gasLimit, ethAmount, orders, gasPrice, signatures, finalTakerAddress, value, txHash, makerAssetFillAmount, takerAssetFillAmount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert_1.assert.isValidSwapQuote('quote', quote);
                        takerAddress = opts.takerAddress, gasLimit = opts.gasLimit, ethAmount = opts.ethAmount;
                        if (takerAddress !== undefined) {
                            assert_1.assert.isETHAddressHex('takerAddress', takerAddress);
                        }
                        if (gasLimit !== undefined) {
                            assert_1.assert.isNumber('gasLimit', gasLimit);
                        }
                        if (ethAmount !== undefined) {
                            assert_1.assert.isBigNumber('ethAmount', ethAmount);
                        }
                        orders = quote.orders, gasPrice = quote.gasPrice;
                        signatures = orders.map(function (o) { return o.signature; });
                        return [4 /*yield*/, swap_quote_consumer_utils_1.swapQuoteConsumerUtils.getTakerAddressOrThrowAsync(this.provider, opts)];
                    case 1:
                        finalTakerAddress = _a.sent();
                        value = ethAmount || quote.worstCaseQuoteInfo.protocolFeeInWeiAmount;
                        if (!(quote.type === types_1.MarketOperation.Buy)) return [3 /*break*/, 3];
                        makerAssetFillAmount = quote.makerAssetFillAmount;
                        return [4 /*yield*/, this._exchangeContract
                                .marketBuyOrdersFillOrKill(orders, makerAssetFillAmount, signatures)
                                .sendTransactionAsync({
                                from: finalTakerAddress,
                                gas: gasLimit,
                                gasPrice: gasPrice,
                                value: value,
                            })];
                    case 2:
                        txHash = _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        takerAssetFillAmount = quote.takerAssetFillAmount;
                        return [4 /*yield*/, this._exchangeContract
                                .marketSellOrdersFillOrKill(orders, takerAssetFillAmount, signatures)
                                .sendTransactionAsync({
                                from: finalTakerAddress,
                                gas: gasLimit,
                                gasPrice: gasPrice,
                                value: value,
                            })];
                    case 4:
                        txHash = _a.sent();
                        _a.label = 5;
                    case 5: 
                    // TODO(dorothy-zbornak): Handle signature request denied
                    // (see contract-wrappers/decorators)
                    // and ExchangeRevertErrors.IncompleteFillError.
                    return [2 /*return*/, txHash];
                }
            });
        });
    };
    return ExchangeSwapQuoteConsumer;
}());
exports.ExchangeSwapQuoteConsumer = ExchangeSwapQuoteConsumer;
//# sourceMappingURL=exchange_swap_quote_consumer.js.map