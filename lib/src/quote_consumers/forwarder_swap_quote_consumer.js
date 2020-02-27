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
Object.defineProperty(exports, "__esModule", { value: true });
var contract_wrappers_1 = require("@0x/contract-wrappers");
var order_utils_1 = require("@0x/order-utils");
var utils_1 = require("@0x/utils");
var _ = require("lodash");
var constants_1 = require("../constants");
var types_1 = require("../types");
var affiliate_fee_utils_1 = require("../utils/affiliate_fee_utils");
var assert_1 = require("../utils/assert");
var swap_quote_consumer_utils_1 = require("../utils/swap_quote_consumer_utils");
var ForwarderSwapQuoteConsumer = /** @class */ (function () {
    function ForwarderSwapQuoteConsumer(supportedProvider, contractAddresses, options) {
        if (options === void 0) { options = {}; }
        var chainId = _.merge({}, constants_1.constants.DEFAULT_SWAP_QUOTER_OPTS, options).chainId;
        assert_1.assert.isNumber('chainId', chainId);
        var provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.chainId = chainId;
        this._contractAddresses = contractAddresses;
        this._forwarder = new contract_wrappers_1.ForwarderContract(contractAddresses.forwarder, supportedProvider);
    }
    /**
     * Given a SwapQuote, returns 'CalldataInfo' for a forwarder extension call. See type definition of CalldataInfo for more information.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    ForwarderSwapQuoteConsumer.prototype.getCalldataOrThrowAsync = function (quote, opts) {
        if (opts === void 0) { opts = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var extensionContractOpts, feeRecipient, feePercentage, orders, worstCaseQuoteInfo, normalizedFeeRecipientAddress, signatures, ethAmountWithFees, feeAmount, calldataHexString;
            return __generator(this, function (_a) {
                assert_1.assert.isValidForwarderSwapQuote('quote', quote, this._getEtherTokenAssetDataOrThrow());
                extensionContractOpts = __assign({}, constants_1.constants.DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS, opts).extensionContractOpts;
                assert_1.assert.isValidForwarderExtensionContractOpts('extensionContractOpts', extensionContractOpts);
                feeRecipient = extensionContractOpts.feeRecipient, feePercentage = extensionContractOpts.feePercentage;
                orders = quote.orders, worstCaseQuoteInfo = quote.worstCaseQuoteInfo;
                normalizedFeeRecipientAddress = feeRecipient.toLowerCase();
                signatures = _.map(orders, function (o) { return o.signature; });
                ethAmountWithFees = affiliate_fee_utils_1.affiliateFeeUtils.getTotalEthAmountWithAffiliateFee(worstCaseQuoteInfo, feePercentage);
                feeAmount = affiliate_fee_utils_1.affiliateFeeUtils.getFeeAmount(worstCaseQuoteInfo, feePercentage);
                if (quote.type === types_1.MarketOperation.Buy) {
                    calldataHexString = this._forwarder
                        .marketBuyOrdersWithEth(orders, quote.makerAssetFillAmount, signatures, [feeAmount], [normalizedFeeRecipientAddress])
                        .getABIEncodedTransactionData();
                }
                else {
                    calldataHexString = this._forwarder
                        .marketSellOrdersWithEth(orders, signatures, [feeAmount], [normalizedFeeRecipientAddress])
                        .getABIEncodedTransactionData();
                }
                return [2 /*return*/, {
                        calldataHexString: calldataHexString,
                        toAddress: this._forwarder.address,
                        ethAmount: ethAmountWithFees,
                    }];
            });
        });
    };
    /**
     * Given a SwapQuote and desired rate (in Eth), attempt to execute the swap.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    ForwarderSwapQuoteConsumer.prototype.executeSwapQuoteOrThrowAsync = function (quote, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, providedEthAmount, takerAddress, gasLimit, extensionContractOpts, feeRecipient, feePercentage, orders, gasPrice, signatures, finalTakerAddress, ethAmountWithFees, feeAmount, txHash, makerAssetFillAmount;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        assert_1.assert.isValidForwarderSwapQuote('quote', quote, this._getEtherTokenAssetDataOrThrow());
                        _a = __assign({}, constants_1.constants.DEFAULT_FORWARDER_SWAP_QUOTE_EXECUTE_OPTS, opts), providedEthAmount = _a.ethAmount, takerAddress = _a.takerAddress, gasLimit = _a.gasLimit, extensionContractOpts = _a.extensionContractOpts;
                        assert_1.assert.isValidForwarderExtensionContractOpts('extensionContractOpts', extensionContractOpts);
                        feeRecipient = extensionContractOpts.feeRecipient, feePercentage = extensionContractOpts.feePercentage;
                        if (providedEthAmount !== undefined) {
                            assert_1.assert.isBigNumber('ethAmount', providedEthAmount);
                        }
                        if (takerAddress !== undefined) {
                            assert_1.assert.isETHAddressHex('takerAddress', takerAddress);
                        }
                        if (gasLimit !== undefined) {
                            assert_1.assert.isNumber('gasLimit', gasLimit);
                        }
                        orders = quote.orders, gasPrice = quote.gasPrice;
                        signatures = orders.map(function (o) { return o.signature; });
                        return [4 /*yield*/, swap_quote_consumer_utils_1.swapQuoteConsumerUtils.getTakerAddressOrThrowAsync(this.provider, opts)];
                    case 1:
                        finalTakerAddress = _b.sent();
                        ethAmountWithFees = providedEthAmount ||
                            affiliate_fee_utils_1.affiliateFeeUtils.getTotalEthAmountWithAffiliateFee(quote.worstCaseQuoteInfo, feePercentage);
                        feeAmount = affiliate_fee_utils_1.affiliateFeeUtils.getFeeAmount(quote.worstCaseQuoteInfo, feePercentage);
                        if (!(quote.type === types_1.MarketOperation.Buy)) return [3 /*break*/, 3];
                        makerAssetFillAmount = quote.makerAssetFillAmount;
                        return [4 /*yield*/, this._forwarder
                                .marketBuyOrdersWithEth(orders, makerAssetFillAmount, signatures, [feeAmount], [feeRecipient])
                                .sendTransactionAsync({
                                from: finalTakerAddress,
                                gas: gasLimit,
                                gasPrice: gasPrice,
                                value: ethAmountWithFees,
                            })];
                    case 2:
                        txHash = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this._forwarder
                            .marketSellOrdersWithEth(orders, signatures, [feeAmount], [feeRecipient])
                            .sendTransactionAsync({
                            from: finalTakerAddress,
                            gas: gasLimit,
                            gasPrice: gasPrice,
                            value: ethAmountWithFees,
                        })];
                    case 4:
                        txHash = _b.sent();
                        _b.label = 5;
                    case 5: 
                    // TODO(dorothy-zbornak): Handle signature request denied
                    // (see contract-wrappers/decorators)
                    // and ForwarderRevertErrors.CompleteBuyFailed.
                    return [2 /*return*/, txHash];
                }
            });
        });
    };
    ForwarderSwapQuoteConsumer.prototype._getEtherTokenAssetDataOrThrow = function () {
        return order_utils_1.assetDataUtils.encodeERC20AssetData(this._contractAddresses.etherToken);
    };
    return ForwarderSwapQuoteConsumer;
}());
exports.ForwarderSwapQuoteConsumer = ForwarderSwapQuoteConsumer;
//# sourceMappingURL=forwarder_swap_quote_consumer.js.map