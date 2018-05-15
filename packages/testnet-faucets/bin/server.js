require("source-map-support").install();
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("@0xproject/utils");

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = {
    DISPENSER_ADDRESS: process.env.DISPENSER_ADDRESS.toLowerCase(),
    DISPENSER_PRIVATE_KEY: process.env.DISPENSER_PRIVATE_KEY,
    ENVIRONMENT: process.env.FAUCET_ENVIRONMENT,
    INFURA_API_KEY: process.env.INFURA_API_KEY,
    ROLLBAR_ACCESS_KEY: process.env.FAUCET_ROLLBAR_ACCESS_KEY,
};


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("lodash");

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

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
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var utils_1 = __webpack_require__(0);
var rollbar = __webpack_require__(10);
var configs_1 = __webpack_require__(1);
exports.errorReporter = {
    setup: function () {
        var _this = this;
        rollbar.init(configs_1.configs.ROLLBAR_ACCESS_KEY, {
            environment: configs_1.configs.ENVIRONMENT,
        });
        rollbar.handleUncaughtExceptions(configs_1.configs.ROLLBAR_ACCESS_KEY);
        process.on('unhandledRejection', function (err) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        utils_1.logUtils.log("Uncaught exception " + err + ". Stack: " + err.stack);
                        return [4 /*yield*/, this.reportAsync(err)];
                    case 1:
                        _a.sent();
                        process.exit(1);
                        return [2 /*return*/];
                }
            });
        }); });
    },
    reportAsync: function (err, req) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (configs_1.configs.ENVIRONMENT === 'development') {
                    return [2 /*return*/]; // Do not log development environment errors
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        rollbar.handleError(err, req, function (rollbarErr) {
                            if (rollbarErr) {
                                utils_1.logUtils.log("Error reporting to rollbar, ignoring: " + rollbarErr);
                                reject(rollbarErr);
                            }
                            else {
                                resolve();
                            }
                        });
                    })];
            });
        });
    },
    errorHandler: function () {
        return rollbar.errorHandler(configs_1.configs.ROLLBAR_ACCESS_KEY);
    },
};


/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("0x.js");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var configs_1 = __webpack_require__(1);
var productionRpcUrls = {
    '3': "https://ropsten.infura.io/" + configs_1.configs.INFURA_API_KEY,
    '4': "https://rinkeby.infura.io/" + configs_1.configs.INFURA_API_KEY,
    '42': "https://kovan.infura.io/" + configs_1.configs.INFURA_API_KEY,
};
var developmentRpcUrls = {
    '50': 'http://127.0.0.1:8545',
};
exports.rpcUrls = configs_1.configs.ENVIRONMENT === 'development' ? developmentRpcUrls : productionRpcUrls;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(7);


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var bodyParser = __webpack_require__(8);
var express = __webpack_require__(9);
var error_reporter_1 = __webpack_require__(3);
var handler_1 = __webpack_require__(11);
var parameter_transformer_1 = __webpack_require__(18);
// Setup the errorReporter to catch uncaught exceptions and unhandled rejections
error_reporter_1.errorReporter.setup();
var app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
var handler = new handler_1.Handler();
app.get('/ping', function (req, res) {
    res.status(200).send('pong');
});
app.get('/info', handler.getQueueInfo.bind(handler));
app.get('/ether/:recipient', parameter_transformer_1.parameterTransformer.transform, handler.dispenseEther.bind(handler));
app.get('/zrx/:recipient', parameter_transformer_1.parameterTransformer.transform, handler.dispenseZRX.bind(handler));
app.get('/order/weth/:recipient', parameter_transformer_1.parameterTransformer.transform, handler.dispenseWETHOrder.bind(handler));
app.get('/order/zrx/:recipient', parameter_transformer_1.parameterTransformer.transform, handler.dispenseZRXOrder.bind(handler));
// Log to rollbar any errors unhandled by handlers
app.use(error_reporter_1.errorReporter.errorHandler());
var port = process.env.PORT || 3000;
app.listen(port);


/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("body-parser");

/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = require("rollbar");

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
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
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var _0x_js_1 = __webpack_require__(4);
var utils_1 = __webpack_require__(0);
var _ = __webpack_require__(2);
var Web3 = __webpack_require__(12);
// HACK: web3 injects XMLHttpRequest into the global scope and ProviderEngine checks XMLHttpRequest
// to know whether it is running in a browser or node environment. We need it to be undefined since
// we are not running in a browser env.
// Filed issue: https://github.com/ethereum/web3.js/issues/844
global.XMLHttpRequest = undefined;
var subproviders_1 = __webpack_require__(13);
var ProviderEngine = __webpack_require__(14);
var RpcSubprovider = __webpack_require__(15);
var configs_1 = __webpack_require__(1);
var dispatch_queue_1 = __webpack_require__(16);
var dispense_asset_tasks_1 = __webpack_require__(17);
var rpc_urls_1 = __webpack_require__(5);
var RequestedAssetType;
(function (RequestedAssetType) {
    RequestedAssetType["ETH"] = "ETH";
    RequestedAssetType["WETH"] = "WETH";
    RequestedAssetType["ZRX"] = "ZRX";
})(RequestedAssetType || (RequestedAssetType = {}));
var FIVE_DAYS_IN_MS = 4.32e8; // TODO: make this configurable
var Handler = /** @class */ (function () {
    function Handler() {
        var _this = this;
        this._networkConfigByNetworkId = {};
        _.forIn(rpc_urls_1.rpcUrls, function (rpcUrl, networkId) {
            var providerObj = Handler._createProviderEngine(rpcUrl);
            var web3 = new Web3(providerObj);
            var zeroExConfig = {
                networkId: +networkId,
            };
            var zeroEx = new _0x_js_1.ZeroEx(web3.currentProvider, zeroExConfig);
            var dispatchQueue = new dispatch_queue_1.DispatchQueue();
            _this._networkConfigByNetworkId[networkId] = {
                dispatchQueue: dispatchQueue,
                web3: web3,
                zeroEx: zeroEx,
            };
        });
    }
    Handler._createProviderEngine = function (rpcUrl) {
        if (_.isUndefined(configs_1.configs.DISPENSER_PRIVATE_KEY)) {
            throw new Error('Dispenser Private key not found');
        }
        var engine = new ProviderEngine();
        engine.addProvider(new subproviders_1.NonceTrackerSubprovider());
        engine.addProvider(new subproviders_1.PrivateKeyWalletSubprovider(configs_1.configs.DISPENSER_PRIVATE_KEY));
        engine.addProvider(new RpcSubprovider({
            rpcUrl: rpcUrl,
        }));
        engine.start();
        return engine;
    };
    Handler.prototype.getQueueInfo = function (req, res) {
        var _this = this;
        res.setHeader('Content-Type', 'application/json');
        var queueInfo = _.mapValues(rpc_urls_1.rpcUrls, function (rpcUrl, networkId) {
            var dispatchQueue = _this._networkConfigByNetworkId[networkId].dispatchQueue;
            return {
                full: dispatchQueue.isFull(),
                size: dispatchQueue.size(),
            };
        });
        var payload = JSON.stringify(queueInfo);
        res.status(200).send(payload);
    };
    Handler.prototype.dispenseEther = function (req, res) {
        this._dispenseAsset(req, res, RequestedAssetType.ETH);
    };
    Handler.prototype.dispenseZRX = function (req, res) {
        this._dispenseAsset(req, res, RequestedAssetType.ZRX);
    };
    Handler.prototype.dispenseWETHOrder = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._dispenseOrder(req, res, RequestedAssetType.WETH)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Handler.prototype.dispenseZRXOrder = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._dispenseOrder(req, res, RequestedAssetType.ZRX)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Handler.prototype._dispenseAsset = function (req, res, requestedAssetType) {
        var networkId = req.params.networkId;
        var recipient = req.params.recipient;
        var networkConfig = this._networkConfigByNetworkId[networkId];
        var dispenserTask;
        switch (requestedAssetType) {
            case RequestedAssetType.ETH:
                dispenserTask = dispense_asset_tasks_1.dispenseAssetTasks.dispenseEtherTask(recipient, networkConfig.web3);
                break;
            case RequestedAssetType.WETH:
            case RequestedAssetType.ZRX:
                dispenserTask = dispense_asset_tasks_1.dispenseAssetTasks.dispenseTokenTask(recipient, requestedAssetType, networkConfig.zeroEx);
                break;
            default:
                throw new Error("Unsupported asset type: " + requestedAssetType);
        }
        var didAddToQueue = networkConfig.dispatchQueue.add(dispenserTask);
        if (!didAddToQueue) {
            res.status(503).send('QUEUE_IS_FULL');
            return;
        }
        utils_1.logUtils.log("Added " + recipient + " to queue: " + requestedAssetType + " networkId: " + networkId);
        res.status(200).end();
    };
    Handler.prototype._dispenseOrder = function (req, res, requestedAssetType) {
        return __awaiter(this, void 0, void 0, function () {
            var networkConfig, zeroEx, makerToken, takerTokenSymbol, takerToken, makerTokenAmount, takerTokenAmount, order, orderHash, signature, signedOrder, signedOrderHash, payload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        networkConfig = _.get(this._networkConfigByNetworkId, req.params.networkId);
                        if (_.isUndefined(networkConfig)) {
                            res.status(400).send('UNSUPPORTED_NETWORK_ID');
                            return [2 /*return*/];
                        }
                        zeroEx = networkConfig.zeroEx;
                        res.setHeader('Content-Type', 'application/json');
                        return [4 /*yield*/, zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync(requestedAssetType)];
                    case 1:
                        makerToken = _a.sent();
                        if (_.isUndefined(makerToken)) {
                            throw new Error("Unsupported asset type: " + requestedAssetType);
                        }
                        takerTokenSymbol = requestedAssetType === RequestedAssetType.WETH ? RequestedAssetType.ZRX : RequestedAssetType.WETH;
                        return [4 /*yield*/, zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync(takerTokenSymbol)];
                    case 2:
                        takerToken = _a.sent();
                        if (_.isUndefined(takerToken)) {
                            throw new Error("Unsupported asset type: " + requestedAssetType);
                        }
                        makerTokenAmount = _0x_js_1.ZeroEx.toBaseUnitAmount(new utils_1.BigNumber(0.1), makerToken.decimals);
                        takerTokenAmount = _0x_js_1.ZeroEx.toBaseUnitAmount(new utils_1.BigNumber(0.1), takerToken.decimals);
                        order = {
                            maker: configs_1.configs.DISPENSER_ADDRESS,
                            taker: req.params.recipient,
                            makerFee: new utils_1.BigNumber(0),
                            takerFee: new utils_1.BigNumber(0),
                            makerTokenAmount: makerTokenAmount,
                            takerTokenAmount: takerTokenAmount,
                            makerTokenAddress: makerToken.address,
                            takerTokenAddress: takerToken.address,
                            salt: _0x_js_1.ZeroEx.generatePseudoRandomSalt(),
                            exchangeContractAddress: zeroEx.exchange.getContractAddress(),
                            feeRecipient: _0x_js_1.ZeroEx.NULL_ADDRESS,
                            expirationUnixTimestampSec: new utils_1.BigNumber(Date.now() + FIVE_DAYS_IN_MS),
                        };
                        orderHash = _0x_js_1.ZeroEx.getOrderHashHex(order);
                        return [4 /*yield*/, zeroEx.signOrderHashAsync(orderHash, configs_1.configs.DISPENSER_ADDRESS, false)];
                    case 3:
                        signature = _a.sent();
                        signedOrder = __assign({}, order, { ecSignature: signature });
                        signedOrderHash = _0x_js_1.ZeroEx.getOrderHashHex(signedOrder);
                        payload = JSON.stringify(signedOrder);
                        utils_1.logUtils.log("Dispensed signed order: " + payload);
                        res.status(200).send(payload);
                        return [2 /*return*/];
                }
            });
        });
    };
    return Handler;
}());
exports.Handler = Handler;


/***/ }),
/* 12 */
/***/ (function(module, exports) {

module.exports = require("web3");

/***/ }),
/* 13 */
/***/ (function(module, exports) {

module.exports = require("@0xproject/subproviders");

/***/ }),
/* 14 */
/***/ (function(module, exports) {

module.exports = require("web3-provider-engine");

/***/ }),
/* 15 */
/***/ (function(module, exports) {

module.exports = require("web3-provider-engine/subproviders/rpc");

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

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
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var utils_1 = __webpack_require__(0);
var _ = __webpack_require__(2);
var error_reporter_1 = __webpack_require__(3);
var MAX_QUEUE_SIZE = 500;
var DEFAULT_QUEUE_INTERVAL_MS = 1000;
var DispatchQueue = /** @class */ (function () {
    function DispatchQueue() {
        this._queueIntervalMs = DEFAULT_QUEUE_INTERVAL_MS;
        this._queue = [];
        this._start();
    }
    DispatchQueue.prototype.add = function (taskAsync) {
        if (this.isFull()) {
            return false;
        }
        this._queue.push(taskAsync);
        return true;
    };
    DispatchQueue.prototype.size = function () {
        return this._queue.length;
    };
    DispatchQueue.prototype.isFull = function () {
        return this.size() >= MAX_QUEUE_SIZE;
    };
    DispatchQueue.prototype.stop = function () {
        if (!_.isUndefined(this._queueIntervalIdIfExists)) {
            utils_1.intervalUtils.clearAsyncExcludingInterval(this._queueIntervalIdIfExists);
        }
    };
    DispatchQueue.prototype._start = function () {
        var _this = this;
        this._queueIntervalIdIfExists = utils_1.intervalUtils.setAsyncExcludingInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            var taskAsync;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        taskAsync = this._queue.shift();
                        if (_.isUndefined(taskAsync)) {
                            return [2 /*return*/, Promise.resolve()];
                        }
                        return [4 /*yield*/, taskAsync()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }, this._queueIntervalMs, function (err) {
            utils_1.logUtils.log("Unexpected err: " + err + " - " + JSON.stringify(err));
            // tslint:disable-next-line:no-floating-promises
            error_reporter_1.errorReporter.reportAsync(err);
        });
    };
    return DispatchQueue;
}());
exports.DispatchQueue = DispatchQueue;


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

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
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var _0x_js_1 = __webpack_require__(4);
var utils_1 = __webpack_require__(0);
var _ = __webpack_require__(2);
var configs_1 = __webpack_require__(1);
var DISPENSE_AMOUNT_ETHER = 0.1;
var DISPENSE_AMOUNT_TOKEN = 0.1;
var DISPENSE_MAX_AMOUNT_TOKEN = 2;
var DISPENSE_MAX_AMOUNT_ETHER = 2;
exports.dispenseAssetTasks = {
    dispenseEtherTask: function (recipientAddress, web3) {
        var _this = this;
        return function () { return __awaiter(_this, void 0, void 0, function () {
            var userBalance, maxAmountInWei, sendTransactionAsync, txHash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        utils_1.logUtils.log("Processing ETH " + recipientAddress);
                        return [4 /*yield*/, utils_1.promisify(web3.eth.getBalance)(recipientAddress)];
                    case 1:
                        userBalance = _a.sent();
                        maxAmountInWei = new utils_1.BigNumber(web3.toWei(DISPENSE_MAX_AMOUNT_ETHER, 'ether'));
                        if (userBalance.greaterThanOrEqualTo(maxAmountInWei)) {
                            utils_1.logUtils.log("User exceeded ETH balance maximum (" + maxAmountInWei + ") " + recipientAddress + " " + userBalance + " ");
                            return [2 /*return*/];
                        }
                        sendTransactionAsync = utils_1.promisify(web3.eth.sendTransaction);
                        return [4 /*yield*/, sendTransactionAsync({
                                from: configs_1.configs.DISPENSER_ADDRESS,
                                to: recipientAddress,
                                value: web3.toWei(DISPENSE_AMOUNT_ETHER, 'ether'),
                            })];
                    case 2:
                        txHash = _a.sent();
                        utils_1.logUtils.log("Sent " + DISPENSE_AMOUNT_ETHER + " ETH to " + recipientAddress + " tx: " + txHash);
                        return [2 /*return*/];
                }
            });
        }); };
    },
    dispenseTokenTask: function (recipientAddress, tokenSymbol, zeroEx) {
        var _this = this;
        return function () { return __awaiter(_this, void 0, void 0, function () {
            var amountToDispense, token, baseUnitAmount, userBalanceBaseUnits, maxAmountBaseUnits, txHash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        utils_1.logUtils.log("Processing " + tokenSymbol + " " + recipientAddress);
                        amountToDispense = new utils_1.BigNumber(DISPENSE_AMOUNT_TOKEN);
                        return [4 /*yield*/, zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync(tokenSymbol)];
                    case 1:
                        token = _a.sent();
                        if (_.isUndefined(token)) {
                            throw new Error("Unsupported asset type: " + tokenSymbol);
                        }
                        baseUnitAmount = _0x_js_1.ZeroEx.toBaseUnitAmount(amountToDispense, token.decimals);
                        return [4 /*yield*/, zeroEx.token.getBalanceAsync(token.address, recipientAddress)];
                    case 2:
                        userBalanceBaseUnits = _a.sent();
                        maxAmountBaseUnits = _0x_js_1.ZeroEx.toBaseUnitAmount(new utils_1.BigNumber(DISPENSE_MAX_AMOUNT_TOKEN), token.decimals);
                        if (userBalanceBaseUnits.greaterThanOrEqualTo(maxAmountBaseUnits)) {
                            utils_1.logUtils.log("User exceeded token balance maximum (" + maxAmountBaseUnits + ") " + recipientAddress + " " + userBalanceBaseUnits + " ");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, zeroEx.token.transferAsync(token.address, configs_1.configs.DISPENSER_ADDRESS, recipientAddress, baseUnitAmount)];
                    case 3:
                        txHash = _a.sent();
                        utils_1.logUtils.log("Sent " + amountToDispense + " ZRX to " + recipientAddress + " tx: " + txHash);
                        return [2 /*return*/];
                }
            });
        }); };
    },
};


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = __webpack_require__(0);
var _ = __webpack_require__(2);
var rpc_urls_1 = __webpack_require__(5);
var DEFAULT_NETWORK_ID = 42; // kovan
exports.parameterTransformer = {
    transform: function (req, res, next) {
        var recipientAddress = req.params.recipient;
        if (_.isUndefined(recipientAddress) || !utils_1.addressUtils.isAddress(recipientAddress)) {
            res.status(400).send('INVALID_RECIPIENT_ADDRESS');
            return;
        }
        var lowerCaseRecipientAddress = recipientAddress.toLowerCase();
        req.params.recipient = lowerCaseRecipientAddress;
        var networkId = _.get(req.query, 'networkId', DEFAULT_NETWORK_ID);
        var rpcUrlIfExists = _.get(rpc_urls_1.rpcUrls, networkId);
        if (_.isUndefined(rpcUrlIfExists)) {
            res.status(400).send('UNSUPPORTED_NETWORK_ID');
            return;
        }
        req.params.networkId = networkId;
        next();
    },
};


/***/ })
/******/ ]);
//# sourceMappingURL=server.js.map