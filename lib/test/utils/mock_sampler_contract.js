"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var contract_wrappers_1 = require("@0x/contract-wrappers");
var contracts_test_utils_1 = require("@0x/contracts-test-utils");
var utils_1 = require("@0x/utils");
var DUMMY_PROVIDER = {
    sendAsync: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        /* no-op */
    },
};
var MockSamplerContract = /** @class */ (function (_super) {
    __extends(MockSamplerContract, _super);
    function MockSamplerContract(handlers) {
        if (handlers === void 0) { handlers = {}; }
        var _this = _super.call(this, contracts_test_utils_1.constants.NULL_ADDRESS, DUMMY_PROVIDER) || this;
        _this._handlers = {};
        _this._handlers = handlers;
        return _this;
    }
    MockSamplerContract.prototype.batchCall = function (callDatas) {
        var _this = this;
        return __assign({}, _super.prototype.batchCall.call(this, callDatas), { callAsync: function () {
                var callArgs = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    callArgs[_i] = arguments[_i];
                }
                return __awaiter(_this, void 0, void 0, function () {
                    var _this = this;
                    return __generator(this, function (_a) {
                        return [2 /*return*/, callDatas.map(function (callData) { return _this._callEncodedFunction(callData); })];
                    });
                });
            } });
    };
    MockSamplerContract.prototype.getOrderFillableMakerAssetAmounts = function (orders, signatures) {
        return this._wrapCall(_super.prototype.getOrderFillableMakerAssetAmounts, this._handlers.getOrderFillableMakerAssetAmounts, orders, signatures);
    };
    MockSamplerContract.prototype.getOrderFillableTakerAssetAmounts = function (orders, signatures) {
        return this._wrapCall(_super.prototype.getOrderFillableTakerAssetAmounts, this._handlers.getOrderFillableTakerAssetAmounts, orders, signatures);
    };
    MockSamplerContract.prototype.sampleSellsFromKyberNetwork = function (takerToken, makerToken, takerAssetAmounts) {
        return this._wrapCall(_super.prototype.sampleSellsFromKyberNetwork, this._handlers.sampleSellsFromKyberNetwork, takerToken, makerToken, takerAssetAmounts);
    };
    MockSamplerContract.prototype.sampleSellsFromEth2Dai = function (takerToken, makerToken, takerAssetAmounts) {
        return this._wrapCall(_super.prototype.sampleSellsFromEth2Dai, this._handlers.sampleSellsFromEth2Dai, takerToken, makerToken, takerAssetAmounts);
    };
    MockSamplerContract.prototype.sampleSellsFromUniswap = function (takerToken, makerToken, takerAssetAmounts) {
        return this._wrapCall(_super.prototype.sampleSellsFromUniswap, this._handlers.sampleSellsFromUniswap, takerToken, makerToken, takerAssetAmounts);
    };
    MockSamplerContract.prototype.sampleBuysFromEth2Dai = function (takerToken, makerToken, makerAssetAmounts) {
        return this._wrapCall(_super.prototype.sampleBuysFromEth2Dai, this._handlers.sampleBuysFromEth2Dai, takerToken, makerToken, makerAssetAmounts);
    };
    MockSamplerContract.prototype.sampleBuysFromUniswap = function (takerToken, makerToken, makerAssetAmounts) {
        return this._wrapCall(_super.prototype.sampleBuysFromUniswap, this._handlers.sampleBuysFromUniswap, takerToken, makerToken, makerAssetAmounts);
    };
    MockSamplerContract.prototype._callEncodedFunction = function (callData) {
        var _this = this;
        var e_1, _a;
        // tslint:disable-next-line: custom-no-magic-numbers
        var selector = utils_1.hexUtils.slice(callData, 0, 4);
        try {
            for (var _b = __values(Object.entries(this._handlers)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), name_1 = _d[0], handler = _d[1];
                if (handler && this.getSelector(name_1) === selector) {
                    var args = this.getABIDecodedTransactionData(name_1, callData);
                    var result = handler.apply(void 0, __spread(args));
                    return this._lookupAbiEncoder(this.getFunctionSignature(name_1)).encodeReturnValues([result]);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (selector === this.getSelector('batchCall')) {
            var calls = this.getABIDecodedTransactionData('batchCall', callData);
            var results = calls.map(function (cd) { return _this._callEncodedFunction(cd); });
            return this._lookupAbiEncoder(this.getFunctionSignature('batchCall')).encodeReturnValues([results]);
        }
        throw new Error("Unkown selector: " + selector);
    };
    MockSamplerContract.prototype._wrapCall = function (superFn, handler) {
        var _this = this;
        // tslint:disable-next-line: trailing-comma
        var args = [];
        for (
        // tslint:disable-next-line: trailing-comma
        var _i = 2; 
        // tslint:disable-next-line: trailing-comma
        _i < arguments.length; 
        // tslint:disable-next-line: trailing-comma
        _i++) {
            // tslint:disable-next-line: trailing-comma
            args[_i - 2] = arguments[_i];
        }
        return __assign({}, superFn.call.apply(superFn, __spread([this], args)), { callAsync: function () {
                var callArgs = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    callArgs[_i] = arguments[_i];
                }
                return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        if (!handler) {
                            throw new Error(superFn.name + " handler undefined");
                        }
                        return [2 /*return*/, handler.call.apply(handler, __spread([this], args))];
                    });
                });
            } });
    };
    return MockSamplerContract;
}(contract_wrappers_1.IERC20BridgeSamplerContract));
exports.MockSamplerContract = MockSamplerContract;
//# sourceMappingURL=mock_sampler_contract.js.map