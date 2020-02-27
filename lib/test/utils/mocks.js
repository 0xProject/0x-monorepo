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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var contracts_test_utils_1 = require("@0x/contracts-test-utils");
var orderbook_1 = require("@0x/orderbook");
var utils_1 = require("@0x/utils");
var TypeMoq = require("typemoq");
var swap_quoter_1 = require("../../src/swap_quoter");
var protocol_fee_utils_1 = require("../../src/utils/protocol_fee_utils");
var PROTOCOL_FEE_MULTIPLIER = 150000;
// tslint:disable: max-classes-per-file
var OrderbookClass = /** @class */ (function (_super) {
    __extends(OrderbookClass, _super);
    function OrderbookClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // tslint:disable-next-line:prefer-function-over-method
    OrderbookClass.prototype.getOrdersAsync = function (_makerAssetData, _takerAssetData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, []];
            });
        });
    };
    // tslint:disable-next-line:prefer-function-over-method
    OrderbookClass.prototype.getAvailableAssetDatasAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, []];
            });
        });
    };
    // tslint:disable-next-line:prefer-function-over-method
    OrderbookClass.prototype.addOrdersAsync = function (_orders) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { accepted: [], rejected: [] }];
            });
        });
    };
    return OrderbookClass;
}(orderbook_1.Orderbook));
exports.orderbookMock = function () {
    return TypeMoq.Mock.ofType(OrderbookClass, TypeMoq.MockBehavior.Strict);
};
exports.mockAvailableAssetDatas = function (mockOrderbook, availableAssetDatas) {
    mockOrderbook
        .setup(function (op) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, op.getAvailableAssetDatasAsync()];
    }); }); })
        .returns(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, availableAssetDatas];
    }); }); })
        .verifiable(TypeMoq.Times.once());
    mockOrderbook
        .setup(function (o) { return o._orderProvider; })
        .returns(function () { return undefined; })
        .verifiable(TypeMoq.Times.atLeast(0));
    mockOrderbook
        .setup(function (o) { return o._orderStore; })
        .returns(function () { return undefined; })
        .verifiable(TypeMoq.Times.atLeast(0));
};
var partiallyMockedSwapQuoter = function (provider, orderbook) {
    var rawSwapQuoter = new swap_quoter_1.SwapQuoter(provider, orderbook);
    var mockedSwapQuoter = TypeMoq.Mock.ofInstance(rawSwapQuoter, TypeMoq.MockBehavior.Loose, false);
    mockedSwapQuoter.callBase = true;
    return mockedSwapQuoter;
};
var ProtocolFeeUtilsClass = /** @class */ (function (_super) {
    __extends(ProtocolFeeUtilsClass, _super);
    function ProtocolFeeUtilsClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // tslint:disable-next-line:prefer-function-over-method
    ProtocolFeeUtilsClass.prototype.getProtocolFeeMultiplierAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new utils_1.BigNumber(PROTOCOL_FEE_MULTIPLIER)];
            });
        });
    };
    // tslint:disable-next-line:prefer-function-over-method
    ProtocolFeeUtilsClass.prototype.getGasPriceEstimationOrThrowAsync = function (_shouldHardRefresh) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new utils_1.BigNumber(contracts_test_utils_1.constants.DEFAULT_GAS_PRICE)];
            });
        });
    };
    return ProtocolFeeUtilsClass;
}(protocol_fee_utils_1.ProtocolFeeUtils));
exports.protocolFeeUtilsMock = function () {
    var mockProtocolFeeUtils = TypeMoq.Mock.ofType(ProtocolFeeUtilsClass, TypeMoq.MockBehavior.Loose);
    mockProtocolFeeUtils.callBase = true;
    return mockProtocolFeeUtils;
};
var mockGetSignedOrdersWithFillableAmountsAsyncAsync = function (mockedSwapQuoter, makerAssetData, takerAssetData, signedOrders) {
    mockedSwapQuoter
        .setup(function (a) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, a.getSignedOrdersWithFillableAmountsAsync(makerAssetData, takerAssetData)];
    }); }); })
        .returns(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, signedOrders];
    }); }); })
        .verifiable(TypeMoq.Times.once());
};
exports.mockedSwapQuoterWithFillableAmounts = function (provider, orderbook, makerAssetData, takerAssetData, signedOrders) {
    var mockedAssetQuoter = partiallyMockedSwapQuoter(provider, orderbook);
    mockGetSignedOrdersWithFillableAmountsAsyncAsync(mockedAssetQuoter, makerAssetData, takerAssetData, signedOrders);
    return mockedAssetQuoter;
};
//# sourceMappingURL=mocks.js.map