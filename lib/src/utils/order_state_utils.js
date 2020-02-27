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
Object.defineProperty(exports, "__esModule", { value: true });
var order_utils_1 = require("@0x/order-utils");
var types_1 = require("@0x/types");
var constants_1 = require("../constants");
/**
 * Utility class to retrieve order state if needed outside of using the ERC20BridgeSampler
 */
var OrderStateUtils = /** @class */ (function () {
    function OrderStateUtils(devUtils) {
        this._devUtils = devUtils;
    }
    OrderStateUtils.prototype.getSignedOrdersWithFillableAmountsAsync = function (signedOrders) {
        return __awaiter(this, void 0, void 0, function () {
            var signatures, _a, ordersInfo, fillableTakerAssetAmounts, isValidSignatures, ordersOnChainMetadata;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        signatures = signedOrders.map(function (o) { return o.signature; });
                        return [4 /*yield*/, this._devUtils
                                .getOrderRelevantStates(signedOrders, signatures)
                                .callAsync()];
                    case 1:
                        _a = __read.apply(void 0, [_b.sent(), 3]), ordersInfo = _a[0], fillableTakerAssetAmounts = _a[1], isValidSignatures = _a[2];
                        ordersOnChainMetadata = ordersInfo.map(function (orderInfo, index) {
                            return __assign({}, orderInfo, { fillableTakerAssetAmount: fillableTakerAssetAmounts[index], isValidSignature: isValidSignatures[index] });
                        });
                        // take orders + on chain information and find the valid orders and fillable makerAsset or takerAsset amounts
                        return [2 /*return*/, signedOrders.map(function (order, index) {
                                var orderMetadata = ordersOnChainMetadata[index];
                                var fillableTakerAssetAmount = orderMetadata.isValidSignature && orderMetadata.orderStatus === types_1.OrderStatus.Fillable
                                    ? orderMetadata.fillableTakerAssetAmount
                                    : constants_1.constants.ZERO_AMOUNT;
                                return __assign({}, order, { fillableTakerAssetAmount: fillableTakerAssetAmount, fillableMakerAssetAmount: order_utils_1.orderCalculationUtils.getMakerFillAmount(order, fillableTakerAssetAmount), fillableTakerFeeAmount: order_utils_1.orderCalculationUtils.getTakerFeeAmount(order, fillableTakerAssetAmount) });
                            })];
                }
            });
        });
    };
    return OrderStateUtils;
}());
exports.OrderStateUtils = OrderStateUtils;
//# sourceMappingURL=order_state_utils.js.map