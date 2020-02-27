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
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
var src_1 = require("../../src");
var constants_1 = require("../../src/constants");
var types_1 = require("../../src/types");
/**
 * Creates a swap quote given orders.
 */
function getFullyFillableSwapQuoteWithNoFeesAsync(makerAssetData, takerAssetData, orders, operation, gasPrice, protocolFeeUtils) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, makerAssetFillAmount, totalTakerAssetAmount, quoteInfo, _b, breakdown, quoteBase;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    makerAssetFillAmount = utils_1.BigNumber.sum.apply(utils_1.BigNumber, __spread([0], orders.map(function (o) { return o.makerAssetAmount; })));
                    totalTakerAssetAmount = utils_1.BigNumber.sum.apply(utils_1.BigNumber, __spread([0], orders.map(function (o) { return o.takerAssetAmount; })));
                    _b = {
                        makerAssetAmount: makerAssetFillAmount,
                        feeTakerAssetAmount: constants_1.constants.ZERO_AMOUNT,
                        takerAssetAmount: totalTakerAssetAmount,
                        totalTakerAssetAmount: totalTakerAssetAmount
                    };
                    return [4 /*yield*/, protocolFeeUtils.calculateWorstCaseProtocolFeeAsync(orders, gasPrice)];
                case 1:
                    quoteInfo = (_b.protocolFeeInWeiAmount = _c.sent(),
                        _b);
                    breakdown = (_a = {},
                        _a[src_1.ERC20BridgeSource.Native] = new utils_1.BigNumber(1),
                        _a);
                    quoteBase = {
                        makerAssetData: makerAssetData,
                        takerAssetData: takerAssetData,
                        orders: orders,
                        gasPrice: gasPrice,
                        bestCaseQuoteInfo: quoteInfo,
                        worstCaseQuoteInfo: quoteInfo,
                        sourceBreakdown: breakdown,
                    };
                    if (operation === types_1.MarketOperation.Buy) {
                        return [2 /*return*/, __assign({}, quoteBase, { type: types_1.MarketOperation.Buy, makerAssetFillAmount: makerAssetFillAmount })];
                    }
                    else {
                        return [2 /*return*/, __assign({}, quoteBase, { type: types_1.MarketOperation.Sell, takerAssetFillAmount: totalTakerAssetAmount })];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.getFullyFillableSwapQuoteWithNoFeesAsync = getFullyFillableSwapQuoteWithNoFeesAsync;
//# sourceMappingURL=swap_quote.js.map