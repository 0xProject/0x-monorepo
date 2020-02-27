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
var utils_1 = require("@0x/utils");
var heartbeats = require("heartbeats");
var constants_1 = require("../constants");
var types_1 = require("../types");
var ProtocolFeeUtils = /** @class */ (function () {
    function ProtocolFeeUtils(gasPricePollingIntervalInMs, initialGasPrice) {
        if (initialGasPrice === void 0) { initialGasPrice = constants_1.constants.ZERO_AMOUNT; }
        this._gasPriceHeart = heartbeats.createHeart(gasPricePollingIntervalInMs);
        this.gasPriceEstimation = initialGasPrice;
        this._initializeHeartBeat();
    }
    // TODO(dave4506) at some point, we should add a heart beat to the multiplier, or some RPC call to fetch latest multiplier.
    // tslint:disable-next-line:prefer-function-over-method
    ProtocolFeeUtils.prototype.getProtocolFeeMultiplierAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, constants_1.constants.PROTOCOL_FEE_MULTIPLIER];
            });
        });
    };
    ProtocolFeeUtils.prototype.getGasPriceEstimationOrThrowAsync = function (shouldHardRefresh) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.gasPriceEstimation.eq(constants_1.constants.ZERO_AMOUNT)) {
                    return [2 /*return*/, this._getGasPriceFromGasStationOrThrowAsync()];
                }
                if (shouldHardRefresh) {
                    return [2 /*return*/, this._getGasPriceFromGasStationOrThrowAsync()];
                }
                else {
                    return [2 /*return*/, this.gasPriceEstimation];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Destroys any subscriptions or connections.
     */
    ProtocolFeeUtils.prototype.destroyAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this._gasPriceHeart.kill();
                return [2 /*return*/];
            });
        });
    };
    /**
     * Calculates protocol fee with protofol fee multiplier for each fill.
     */
    ProtocolFeeUtils.prototype.calculateWorstCaseProtocolFeeAsync = function (orders, gasPrice) {
        return __awaiter(this, void 0, void 0, function () {
            var protocolFeeMultiplier, protocolFee;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getProtocolFeeMultiplierAsync()];
                    case 1:
                        protocolFeeMultiplier = _a.sent();
                        protocolFee = new utils_1.BigNumber(orders.length).times(protocolFeeMultiplier).times(gasPrice);
                        return [2 /*return*/, protocolFee];
                }
            });
        });
    };
    // tslint:disable-next-line: prefer-function-over-method
    ProtocolFeeUtils.prototype._getGasPriceFromGasStationOrThrowAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, gasInfo, BASE_TEN, gasPriceGwei, unit, gasPriceWei, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch(constants_1.constants.ETH_GAS_STATION_API_BASE_URL + "/json/ethgasAPI.json")];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        gasInfo = _a.sent();
                        BASE_TEN = 10;
                        gasPriceGwei = new utils_1.BigNumber(gasInfo.fast / BASE_TEN);
                        unit = new utils_1.BigNumber(BASE_TEN).pow(9);
                        gasPriceWei = unit.times(gasPriceGwei);
                        return [2 /*return*/, gasPriceWei];
                    case 3:
                        e_1 = _a.sent();
                        throw new Error(types_1.SwapQuoterError.NoGasPriceProvidedOrEstimated);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ProtocolFeeUtils.prototype._initializeHeartBeat = function () {
        var _this = this;
        this._gasPriceHeart.createEvent(1, function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, this._getGasPriceFromGasStationOrThrowAsync()];
                    case 1:
                        _a.gasPriceEstimation = _b.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    return ProtocolFeeUtils;
}());
exports.ProtocolFeeUtils = ProtocolFeeUtils;
//# sourceMappingURL=protocol_fee_utils.js.map