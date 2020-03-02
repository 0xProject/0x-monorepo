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
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma enum-naming
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
var base_contract_1 = require("@0x/base-contract");
var json_schemas_1 = require("@0x/json-schemas");
var utils_1 = require("@0x/utils");
var web3_wrapper_1 = require("@0x/web3-wrapper");
var assert_1 = require("@0x/assert");
var ethers = require("ethers");
var WETH9Events;
(function (WETH9Events) {
    WETH9Events["Approval"] = "Approval";
    WETH9Events["Deposit"] = "Deposit";
    WETH9Events["Transfer"] = "Transfer";
    WETH9Events["Withdrawal"] = "Withdrawal";
})(WETH9Events = exports.WETH9Events || (exports.WETH9Events = {}));
/* istanbul ignore next */
// tslint:disable:array-type
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
var WETH9Contract = /** @class */ (function (_super) {
    __extends(WETH9Contract, _super);
    function WETH9Contract(address, supportedProvider, txDefaults, logDecodeDependencies, deployedBytecode) {
        if (deployedBytecode === void 0) { deployedBytecode = WETH9Contract.deployedBytecode; }
        var _this = _super.call(this, 'WETH9', WETH9Contract.ABI(), address, supportedProvider, txDefaults, logDecodeDependencies, deployedBytecode) || this;
        _this._methodABIIndex = {};
        utils_1.classUtils.bindAll(_this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        _this._subscriptionManager = new base_contract_1.SubscriptionManager(WETH9Contract.ABI(), _this._web3Wrapper);
        WETH9Contract.ABI().forEach(function (item, index) {
            if (item.type === 'function') {
                var methodAbi = item;
                _this._methodABIIndex[methodAbi.name] = index;
            }
        });
        return _this;
    }
    WETH9Contract.deployFrom0xArtifactAsync = function (artifact, supportedProvider, txDefaults, logDecodeDependencies) {
        return __awaiter(this, void 0, void 0, function () {
            var e_1, _a, provider, bytecode, abi, logDecodeDependenciesAbiOnly, _b, _c, key;
            return __generator(this, function (_d) {
                assert_1.assert.doesConformToSchema('txDefaults', txDefaults, json_schemas_1.schemas.txDataSchema, [
                    json_schemas_1.schemas.addressSchema,
                    json_schemas_1.schemas.numberSchema,
                    json_schemas_1.schemas.jsNumber,
                ]);
                if (artifact.compilerOutput === undefined) {
                    throw new Error('Compiler output not found in the artifact file');
                }
                provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
                bytecode = artifact.compilerOutput.evm.bytecode.object;
                abi = artifact.compilerOutput.abi;
                logDecodeDependenciesAbiOnly = {};
                if (Object.keys(logDecodeDependencies) !== undefined) {
                    try {
                        for (_b = __values(Object.keys(logDecodeDependencies)), _c = _b.next(); !_c.done; _c = _b.next()) {
                            key = _c.value;
                            logDecodeDependenciesAbiOnly[key] = logDecodeDependencies[key].compilerOutput.abi;
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
                return [2 /*return*/, WETH9Contract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly)];
            });
        });
    };
    WETH9Contract.deployWithLibrariesFrom0xArtifactAsync = function (artifact, libraryArtifacts, supportedProvider, txDefaults, logDecodeDependencies) {
        return __awaiter(this, void 0, void 0, function () {
            var e_2, _a, provider, abi, logDecodeDependenciesAbiOnly, _b, _c, key, libraryAddresses, bytecode;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        assert_1.assert.doesConformToSchema('txDefaults', txDefaults, json_schemas_1.schemas.txDataSchema, [
                            json_schemas_1.schemas.addressSchema,
                            json_schemas_1.schemas.numberSchema,
                            json_schemas_1.schemas.jsNumber,
                        ]);
                        if (artifact.compilerOutput === undefined) {
                            throw new Error('Compiler output not found in the artifact file');
                        }
                        provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
                        abi = artifact.compilerOutput.abi;
                        logDecodeDependenciesAbiOnly = {};
                        if (Object.keys(logDecodeDependencies) !== undefined) {
                            try {
                                for (_b = __values(Object.keys(logDecodeDependencies)), _c = _b.next(); !_c.done; _c = _b.next()) {
                                    key = _c.value;
                                    logDecodeDependenciesAbiOnly[key] = logDecodeDependencies[key].compilerOutput.abi;
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                        }
                        return [4 /*yield*/, WETH9Contract._deployLibrariesAsync(artifact, libraryArtifacts, new web3_wrapper_1.Web3Wrapper(provider), txDefaults)];
                    case 1:
                        libraryAddresses = _d.sent();
                        bytecode = base_contract_1.linkLibrariesInBytecode(artifact, libraryAddresses);
                        return [2 /*return*/, WETH9Contract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly)];
                }
            });
        });
    };
    WETH9Contract.deployAsync = function (bytecode, abi, supportedProvider, txDefaults, logDecodeDependencies) {
        return __awaiter(this, void 0, void 0, function () {
            var provider, constructorAbi, iface, deployInfo, txData, web3Wrapper, txDataWithDefaults, txHash, txReceipt, contractInstance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert_1.assert.isHexString('bytecode', bytecode);
                        assert_1.assert.doesConformToSchema('txDefaults', txDefaults, json_schemas_1.schemas.txDataSchema, [
                            json_schemas_1.schemas.addressSchema,
                            json_schemas_1.schemas.numberSchema,
                            json_schemas_1.schemas.jsNumber,
                        ]);
                        provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
                        constructorAbi = base_contract_1.BaseContract._lookupConstructorAbi(abi);
                        base_contract_1.BaseContract._formatABIDataItemList(constructorAbi.inputs, [], base_contract_1.BaseContract._bigNumberToString);
                        iface = new ethers.utils.Interface(abi);
                        deployInfo = iface.deployFunction;
                        txData = deployInfo.encode(bytecode, []);
                        web3Wrapper = new web3_wrapper_1.Web3Wrapper(provider);
                        return [4 /*yield*/, base_contract_1.BaseContract._applyDefaultsToContractTxDataAsync(__assign({ data: txData }, txDefaults), web3Wrapper.estimateGasAsync.bind(web3Wrapper))];
                    case 1:
                        txDataWithDefaults = _a.sent();
                        return [4 /*yield*/, web3Wrapper.sendTransactionAsync(txDataWithDefaults)];
                    case 2:
                        txHash = _a.sent();
                        utils_1.logUtils.log("transactionHash: " + txHash);
                        return [4 /*yield*/, web3Wrapper.awaitTransactionSuccessAsync(txHash)];
                    case 3:
                        txReceipt = _a.sent();
                        utils_1.logUtils.log("WETH9 successfully deployed at " + txReceipt.contractAddress);
                        contractInstance = new WETH9Contract(txReceipt.contractAddress, provider, txDefaults, logDecodeDependencies);
                        contractInstance.constructorArgs = [];
                        return [2 /*return*/, contractInstance];
                }
            });
        });
    };
    /**
     * @returns      The contract ABI
     */
    WETH9Contract.ABI = function () {
        var abi = [
            {
                anonymous: false,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_spender',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'Approval',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'Deposit',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: '_from',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_to',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'Transfer',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'Withdrawal',
                outputs: [],
                type: 'event',
            },
            {
                inputs: [],
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'fallback',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'address',
                    },
                    {
                        name: 'index_1',
                        type: 'address',
                    },
                ],
                name: 'allowance',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'guy',
                        type: 'address',
                    },
                    {
                        name: 'wad',
                        type: 'uint256',
                    },
                ],
                name: 'approve',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'address',
                    },
                ],
                name: 'balanceOf',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'decimals',
                outputs: [
                    {
                        name: '',
                        type: 'uint8',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [],
                name: 'deposit',
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'name',
                outputs: [
                    {
                        name: '',
                        type: 'string',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'symbol',
                outputs: [
                    {
                        name: '',
                        type: 'string',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'totalSupply',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'dst',
                        type: 'address',
                    },
                    {
                        name: 'wad',
                        type: 'uint256',
                    },
                ],
                name: 'transfer',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'src',
                        type: 'address',
                    },
                    {
                        name: 'dst',
                        type: 'address',
                    },
                    {
                        name: 'wad',
                        type: 'uint256',
                    },
                ],
                name: 'transferFrom',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'wad',
                        type: 'uint256',
                    },
                ],
                name: 'withdraw',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
        ];
        return abi;
    };
    WETH9Contract._deployLibrariesAsync = function (artifact, libraryArtifacts, web3Wrapper, txDefaults, libraryAddresses) {
        if (libraryAddresses === void 0) { libraryAddresses = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var e_3, _a, e_4, _b, links, _c, _d, link, _e, _f, libraryName, libraryArtifact, linkedLibraryBytecode, txDataWithDefaults, txHash, contractAddress, e_4_1, e_3_1;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        links = artifact.compilerOutput.evm.bytecode.linkReferences;
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, 15, 16, 17]);
                        _c = __values(Object.values(links)), _d = _c.next();
                        _g.label = 2;
                    case 2:
                        if (!!_d.done) return [3 /*break*/, 14];
                        link = _d.value;
                        _g.label = 3;
                    case 3:
                        _g.trys.push([3, 11, 12, 13]);
                        _e = __values(Object.keys(link)), _f = _e.next();
                        _g.label = 4;
                    case 4:
                        if (!!_f.done) return [3 /*break*/, 10];
                        libraryName = _f.value;
                        if (!!libraryAddresses[libraryName]) return [3 /*break*/, 9];
                        libraryArtifact = libraryArtifacts[libraryName];
                        if (!libraryArtifact) {
                            throw new Error("Missing artifact for linked library \"" + libraryName + "\"");
                        }
                        // Deploy any dependent libraries used by this library.
                        return [4 /*yield*/, WETH9Contract._deployLibrariesAsync(libraryArtifact, libraryArtifacts, web3Wrapper, txDefaults, libraryAddresses)];
                    case 5:
                        // Deploy any dependent libraries used by this library.
                        _g.sent();
                        linkedLibraryBytecode = base_contract_1.linkLibrariesInBytecode(libraryArtifact, libraryAddresses);
                        return [4 /*yield*/, base_contract_1.BaseContract._applyDefaultsToContractTxDataAsync(__assign({ data: linkedLibraryBytecode }, txDefaults), web3Wrapper.estimateGasAsync.bind(web3Wrapper))];
                    case 6:
                        txDataWithDefaults = _g.sent();
                        return [4 /*yield*/, web3Wrapper.sendTransactionAsync(txDataWithDefaults)];
                    case 7:
                        txHash = _g.sent();
                        utils_1.logUtils.log("transactionHash: " + txHash);
                        return [4 /*yield*/, web3Wrapper.awaitTransactionSuccessAsync(txHash)];
                    case 8:
                        contractAddress = (_g.sent()).contractAddress;
                        utils_1.logUtils.log(libraryArtifact.contractName + " successfully deployed at " + contractAddress);
                        libraryAddresses[libraryArtifact.contractName] = contractAddress;
                        _g.label = 9;
                    case 9:
                        _f = _e.next();
                        return [3 /*break*/, 4];
                    case 10: return [3 /*break*/, 13];
                    case 11:
                        e_4_1 = _g.sent();
                        e_4 = { error: e_4_1 };
                        return [3 /*break*/, 13];
                    case 12:
                        try {
                            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                        }
                        finally { if (e_4) throw e_4.error; }
                        return [7 /*endfinally*/];
                    case 13:
                        _d = _c.next();
                        return [3 /*break*/, 2];
                    case 14: return [3 /*break*/, 17];
                    case 15:
                        e_3_1 = _g.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 17];
                    case 16:
                        try {
                            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                        }
                        finally { if (e_3) throw e_3.error; }
                        return [7 /*endfinally*/];
                    case 17: return [2 /*return*/, libraryAddresses];
                }
            });
        });
    };
    WETH9Contract.prototype.getFunctionSignature = function (methodName) {
        var index = this._methodABIIndex[methodName];
        var methodAbi = WETH9Contract.ABI()[index]; // tslint:disable-line:no-unnecessary-type-assertion
        var functionSignature = base_contract_1.methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    };
    WETH9Contract.prototype.getABIDecodedTransactionData = function (methodName, callData) {
        var functionSignature = this.getFunctionSignature(methodName);
        var self = this;
        var abiEncoder = self._lookupAbiEncoder(functionSignature);
        var abiDecodedCallData = abiEncoder.strictDecode(callData);
        return abiDecodedCallData;
    };
    WETH9Contract.prototype.getABIDecodedReturnData = function (methodName, callData) {
        var functionSignature = this.getFunctionSignature(methodName);
        var self = this;
        var abiEncoder = self._lookupAbiEncoder(functionSignature);
        var abiDecodedCallData = abiEncoder.strictDecodeReturnValue(callData);
        return abiDecodedCallData;
    };
    WETH9Contract.prototype.getSelector = function (methodName) {
        var functionSignature = this.getFunctionSignature(methodName);
        var self = this;
        var abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    };
    WETH9Contract.prototype.allowance = function (index_0, index_1) {
        var self = this;
        assert_1.assert.isString('index_0', index_0);
        assert_1.assert.isString('index_1', index_1);
        var functionSignature = 'allowance(address,address)';
        return {
            callAsync: function (callData, defaultBlock) {
                if (callData === void 0) { callData = {}; }
                return __awaiter(this, void 0, void 0, function () {
                    var rawCallResult, abiEncoder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                                return [4 /*yield*/, self._performCallAsync(__assign({}, callData, { data: this.getABIEncodedTransactionData() }), defaultBlock)];
                            case 1:
                                rawCallResult = _a.sent();
                                abiEncoder = self._lookupAbiEncoder(functionSignature);
                                base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                                return [2 /*return*/, abiEncoder.strictDecodeReturnValue(rawCallResult)];
                        }
                    });
                });
            },
            getABIEncodedTransactionData: function () {
                return self._strictEncodeArguments(functionSignature, [index_0.toLowerCase(), index_1.toLowerCase()]);
            },
        };
    };
    WETH9Contract.prototype.approve = function (guy, wad) {
        var self = this;
        assert_1.assert.isString('guy', guy);
        assert_1.assert.isBigNumber('wad', wad);
        var functionSignature = 'approve(address,uint256)';
        return {
            sendTransactionAsync: function (txData, opts) {
                if (opts === void 0) { opts = { shouldValidate: true }; }
                return __awaiter(this, void 0, void 0, function () {
                    var txDataWithDefaults;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, self._applyDefaultsToTxDataAsync(__assign({}, txData, { data: this.getABIEncodedTransactionData() }), this.estimateGasAsync.bind(this))];
                            case 1:
                                txDataWithDefaults = _a.sent();
                                if (!(opts.shouldValidate !== false)) return [3 /*break*/, 3];
                                return [4 /*yield*/, this.callAsync(txDataWithDefaults)];
                            case 2:
                                _a.sent();
                                _a.label = 3;
                            case 3: return [2 /*return*/, self._web3Wrapper.sendTransactionAsync(txDataWithDefaults)];
                        }
                    });
                });
            },
            awaitTransactionSuccessAsync: function (txData, opts) {
                if (opts === void 0) { opts = { shouldValidate: true }; }
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            estimateGasAsync: function (txData) {
                return __awaiter(this, void 0, void 0, function () {
                    var txDataWithDefaults;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, self._applyDefaultsToTxDataAsync(__assign({}, txData, { data: this.getABIEncodedTransactionData() }))];
                            case 1:
                                txDataWithDefaults = _a.sent();
                                return [2 /*return*/, self._web3Wrapper.estimateGasAsync(txDataWithDefaults)];
                        }
                    });
                });
            },
            callAsync: function (callData, defaultBlock) {
                if (callData === void 0) { callData = {}; }
                return __awaiter(this, void 0, void 0, function () {
                    var rawCallResult, abiEncoder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                                return [4 /*yield*/, self._performCallAsync(__assign({}, callData, { data: this.getABIEncodedTransactionData() }), defaultBlock)];
                            case 1:
                                rawCallResult = _a.sent();
                                abiEncoder = self._lookupAbiEncoder(functionSignature);
                                base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                                return [2 /*return*/, abiEncoder.strictDecodeReturnValue(rawCallResult)];
                        }
                    });
                });
            },
            getABIEncodedTransactionData: function () {
                return self._strictEncodeArguments(functionSignature, [guy.toLowerCase(), wad]);
            },
        };
    };
    WETH9Contract.prototype.balanceOf = function (index_0) {
        var self = this;
        assert_1.assert.isString('index_0', index_0);
        var functionSignature = 'balanceOf(address)';
        return {
            callAsync: function (callData, defaultBlock) {
                if (callData === void 0) { callData = {}; }
                return __awaiter(this, void 0, void 0, function () {
                    var rawCallResult, abiEncoder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                                return [4 /*yield*/, self._performCallAsync(__assign({}, callData, { data: this.getABIEncodedTransactionData() }), defaultBlock)];
                            case 1:
                                rawCallResult = _a.sent();
                                abiEncoder = self._lookupAbiEncoder(functionSignature);
                                base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                                return [2 /*return*/, abiEncoder.strictDecodeReturnValue(rawCallResult)];
                        }
                    });
                });
            },
            getABIEncodedTransactionData: function () {
                return self._strictEncodeArguments(functionSignature, [index_0.toLowerCase()]);
            },
        };
    };
    WETH9Contract.prototype.decimals = function () {
        var self = this;
        var functionSignature = 'decimals()';
        return {
            callAsync: function (callData, defaultBlock) {
                if (callData === void 0) { callData = {}; }
                return __awaiter(this, void 0, void 0, function () {
                    var rawCallResult, abiEncoder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                                return [4 /*yield*/, self._performCallAsync(__assign({}, callData, { data: this.getABIEncodedTransactionData() }), defaultBlock)];
                            case 1:
                                rawCallResult = _a.sent();
                                abiEncoder = self._lookupAbiEncoder(functionSignature);
                                base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                                return [2 /*return*/, abiEncoder.strictDecodeReturnValue(rawCallResult)];
                        }
                    });
                });
            },
            getABIEncodedTransactionData: function () {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    };
    WETH9Contract.prototype.deposit = function () {
        var self = this;
        var functionSignature = 'deposit()';
        return {
            sendTransactionAsync: function (txData, opts) {
                if (opts === void 0) { opts = { shouldValidate: true }; }
                return __awaiter(this, void 0, void 0, function () {
                    var txDataWithDefaults;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, self._applyDefaultsToTxDataAsync(__assign({}, txData, { data: this.getABIEncodedTransactionData() }), this.estimateGasAsync.bind(this))];
                            case 1:
                                txDataWithDefaults = _a.sent();
                                if (!(opts.shouldValidate !== false)) return [3 /*break*/, 3];
                                return [4 /*yield*/, this.callAsync(txDataWithDefaults)];
                            case 2:
                                _a.sent();
                                _a.label = 3;
                            case 3: return [2 /*return*/, self._web3Wrapper.sendTransactionAsync(txDataWithDefaults)];
                        }
                    });
                });
            },
            awaitTransactionSuccessAsync: function (txData, opts) {
                if (opts === void 0) { opts = { shouldValidate: true }; }
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            estimateGasAsync: function (txData) {
                return __awaiter(this, void 0, void 0, function () {
                    var txDataWithDefaults;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, self._applyDefaultsToTxDataAsync(__assign({}, txData, { data: this.getABIEncodedTransactionData() }))];
                            case 1:
                                txDataWithDefaults = _a.sent();
                                return [2 /*return*/, self._web3Wrapper.estimateGasAsync(txDataWithDefaults)];
                        }
                    });
                });
            },
            callAsync: function (callData, defaultBlock) {
                if (callData === void 0) { callData = {}; }
                return __awaiter(this, void 0, void 0, function () {
                    var rawCallResult, abiEncoder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                                return [4 /*yield*/, self._performCallAsync(__assign({}, callData, { data: this.getABIEncodedTransactionData() }), defaultBlock)];
                            case 1:
                                rawCallResult = _a.sent();
                                abiEncoder = self._lookupAbiEncoder(functionSignature);
                                base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                                return [2 /*return*/, abiEncoder.strictDecodeReturnValue(rawCallResult)];
                        }
                    });
                });
            },
            getABIEncodedTransactionData: function () {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    };
    WETH9Contract.prototype.name = function () {
        var self = this;
        var functionSignature = 'name()';
        return {
            callAsync: function (callData, defaultBlock) {
                if (callData === void 0) { callData = {}; }
                return __awaiter(this, void 0, void 0, function () {
                    var rawCallResult, abiEncoder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                                return [4 /*yield*/, self._performCallAsync(__assign({}, callData, { data: this.getABIEncodedTransactionData() }), defaultBlock)];
                            case 1:
                                rawCallResult = _a.sent();
                                abiEncoder = self._lookupAbiEncoder(functionSignature);
                                base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                                return [2 /*return*/, abiEncoder.strictDecodeReturnValue(rawCallResult)];
                        }
                    });
                });
            },
            getABIEncodedTransactionData: function () {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    };
    WETH9Contract.prototype.symbol = function () {
        var self = this;
        var functionSignature = 'symbol()';
        return {
            callAsync: function (callData, defaultBlock) {
                if (callData === void 0) { callData = {}; }
                return __awaiter(this, void 0, void 0, function () {
                    var rawCallResult, abiEncoder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                                return [4 /*yield*/, self._performCallAsync(__assign({}, callData, { data: this.getABIEncodedTransactionData() }), defaultBlock)];
                            case 1:
                                rawCallResult = _a.sent();
                                abiEncoder = self._lookupAbiEncoder(functionSignature);
                                base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                                return [2 /*return*/, abiEncoder.strictDecodeReturnValue(rawCallResult)];
                        }
                    });
                });
            },
            getABIEncodedTransactionData: function () {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    };
    WETH9Contract.prototype.totalSupply = function () {
        var self = this;
        var functionSignature = 'totalSupply()';
        return {
            callAsync: function (callData, defaultBlock) {
                if (callData === void 0) { callData = {}; }
                return __awaiter(this, void 0, void 0, function () {
                    var rawCallResult, abiEncoder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                                return [4 /*yield*/, self._performCallAsync(__assign({}, callData, { data: this.getABIEncodedTransactionData() }), defaultBlock)];
                            case 1:
                                rawCallResult = _a.sent();
                                abiEncoder = self._lookupAbiEncoder(functionSignature);
                                base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                                return [2 /*return*/, abiEncoder.strictDecodeReturnValue(rawCallResult)];
                        }
                    });
                });
            },
            getABIEncodedTransactionData: function () {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    };
    WETH9Contract.prototype.transfer = function (dst, wad) {
        var self = this;
        assert_1.assert.isString('dst', dst);
        assert_1.assert.isBigNumber('wad', wad);
        var functionSignature = 'transfer(address,uint256)';
        return {
            sendTransactionAsync: function (txData, opts) {
                if (opts === void 0) { opts = { shouldValidate: true }; }
                return __awaiter(this, void 0, void 0, function () {
                    var txDataWithDefaults;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, self._applyDefaultsToTxDataAsync(__assign({}, txData, { data: this.getABIEncodedTransactionData() }), this.estimateGasAsync.bind(this))];
                            case 1:
                                txDataWithDefaults = _a.sent();
                                if (!(opts.shouldValidate !== false)) return [3 /*break*/, 3];
                                return [4 /*yield*/, this.callAsync(txDataWithDefaults)];
                            case 2:
                                _a.sent();
                                _a.label = 3;
                            case 3: return [2 /*return*/, self._web3Wrapper.sendTransactionAsync(txDataWithDefaults)];
                        }
                    });
                });
            },
            awaitTransactionSuccessAsync: function (txData, opts) {
                if (opts === void 0) { opts = { shouldValidate: true }; }
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            estimateGasAsync: function (txData) {
                return __awaiter(this, void 0, void 0, function () {
                    var txDataWithDefaults;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, self._applyDefaultsToTxDataAsync(__assign({}, txData, { data: this.getABIEncodedTransactionData() }))];
                            case 1:
                                txDataWithDefaults = _a.sent();
                                return [2 /*return*/, self._web3Wrapper.estimateGasAsync(txDataWithDefaults)];
                        }
                    });
                });
            },
            callAsync: function (callData, defaultBlock) {
                if (callData === void 0) { callData = {}; }
                return __awaiter(this, void 0, void 0, function () {
                    var rawCallResult, abiEncoder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                                return [4 /*yield*/, self._performCallAsync(__assign({}, callData, { data: this.getABIEncodedTransactionData() }), defaultBlock)];
                            case 1:
                                rawCallResult = _a.sent();
                                abiEncoder = self._lookupAbiEncoder(functionSignature);
                                base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                                return [2 /*return*/, abiEncoder.strictDecodeReturnValue(rawCallResult)];
                        }
                    });
                });
            },
            getABIEncodedTransactionData: function () {
                return self._strictEncodeArguments(functionSignature, [dst.toLowerCase(), wad]);
            },
        };
    };
    WETH9Contract.prototype.transferFrom = function (src, dst, wad) {
        var self = this;
        assert_1.assert.isString('src', src);
        assert_1.assert.isString('dst', dst);
        assert_1.assert.isBigNumber('wad', wad);
        var functionSignature = 'transferFrom(address,address,uint256)';
        return {
            sendTransactionAsync: function (txData, opts) {
                if (opts === void 0) { opts = { shouldValidate: true }; }
                return __awaiter(this, void 0, void 0, function () {
                    var txDataWithDefaults;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, self._applyDefaultsToTxDataAsync(__assign({}, txData, { data: this.getABIEncodedTransactionData() }), this.estimateGasAsync.bind(this))];
                            case 1:
                                txDataWithDefaults = _a.sent();
                                if (!(opts.shouldValidate !== false)) return [3 /*break*/, 3];
                                return [4 /*yield*/, this.callAsync(txDataWithDefaults)];
                            case 2:
                                _a.sent();
                                _a.label = 3;
                            case 3: return [2 /*return*/, self._web3Wrapper.sendTransactionAsync(txDataWithDefaults)];
                        }
                    });
                });
            },
            awaitTransactionSuccessAsync: function (txData, opts) {
                if (opts === void 0) { opts = { shouldValidate: true }; }
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            estimateGasAsync: function (txData) {
                return __awaiter(this, void 0, void 0, function () {
                    var txDataWithDefaults;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, self._applyDefaultsToTxDataAsync(__assign({}, txData, { data: this.getABIEncodedTransactionData() }))];
                            case 1:
                                txDataWithDefaults = _a.sent();
                                return [2 /*return*/, self._web3Wrapper.estimateGasAsync(txDataWithDefaults)];
                        }
                    });
                });
            },
            callAsync: function (callData, defaultBlock) {
                if (callData === void 0) { callData = {}; }
                return __awaiter(this, void 0, void 0, function () {
                    var rawCallResult, abiEncoder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                                return [4 /*yield*/, self._performCallAsync(__assign({}, callData, { data: this.getABIEncodedTransactionData() }), defaultBlock)];
                            case 1:
                                rawCallResult = _a.sent();
                                abiEncoder = self._lookupAbiEncoder(functionSignature);
                                base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                                return [2 /*return*/, abiEncoder.strictDecodeReturnValue(rawCallResult)];
                        }
                    });
                });
            },
            getABIEncodedTransactionData: function () {
                return self._strictEncodeArguments(functionSignature, [src.toLowerCase(), dst.toLowerCase(), wad]);
            },
        };
    };
    WETH9Contract.prototype.withdraw = function (wad) {
        var self = this;
        assert_1.assert.isBigNumber('wad', wad);
        var functionSignature = 'withdraw(uint256)';
        return {
            sendTransactionAsync: function (txData, opts) {
                if (opts === void 0) { opts = { shouldValidate: true }; }
                return __awaiter(this, void 0, void 0, function () {
                    var txDataWithDefaults;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, self._applyDefaultsToTxDataAsync(__assign({}, txData, { data: this.getABIEncodedTransactionData() }), this.estimateGasAsync.bind(this))];
                            case 1:
                                txDataWithDefaults = _a.sent();
                                if (!(opts.shouldValidate !== false)) return [3 /*break*/, 3];
                                return [4 /*yield*/, this.callAsync(txDataWithDefaults)];
                            case 2:
                                _a.sent();
                                _a.label = 3;
                            case 3: return [2 /*return*/, self._web3Wrapper.sendTransactionAsync(txDataWithDefaults)];
                        }
                    });
                });
            },
            awaitTransactionSuccessAsync: function (txData, opts) {
                if (opts === void 0) { opts = { shouldValidate: true }; }
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            estimateGasAsync: function (txData) {
                return __awaiter(this, void 0, void 0, function () {
                    var txDataWithDefaults;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, self._applyDefaultsToTxDataAsync(__assign({}, txData, { data: this.getABIEncodedTransactionData() }))];
                            case 1:
                                txDataWithDefaults = _a.sent();
                                return [2 /*return*/, self._web3Wrapper.estimateGasAsync(txDataWithDefaults)];
                        }
                    });
                });
            },
            callAsync: function (callData, defaultBlock) {
                if (callData === void 0) { callData = {}; }
                return __awaiter(this, void 0, void 0, function () {
                    var rawCallResult, abiEncoder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                                return [4 /*yield*/, self._performCallAsync(__assign({}, callData, { data: this.getABIEncodedTransactionData() }), defaultBlock)];
                            case 1:
                                rawCallResult = _a.sent();
                                abiEncoder = self._lookupAbiEncoder(functionSignature);
                                base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                                return [2 /*return*/, abiEncoder.strictDecodeReturnValue(rawCallResult)];
                        }
                    });
                });
            },
            getABIEncodedTransactionData: function () {
                return self._strictEncodeArguments(functionSignature, [wad]);
            },
        };
    };
    /**
     * Subscribe to an event type emitted by the WETH9 contract.
     * @param eventName The WETH9 contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    WETH9Contract.prototype.subscribe = function (eventName, indexFilterValues, callback, isVerbose, blockPollingIntervalMs) {
        if (isVerbose === void 0) { isVerbose = false; }
        assert_1.assert.doesBelongToStringEnum('eventName', eventName, WETH9Events);
        assert_1.assert.doesConformToSchema('indexFilterValues', indexFilterValues, json_schemas_1.schemas.indexFilterValuesSchema);
        assert_1.assert.isFunction('callback', callback);
        var subscriptionToken = this._subscriptionManager.subscribe(this.address, eventName, indexFilterValues, WETH9Contract.ABI(), callback, isVerbose, blockPollingIntervalMs);
        return subscriptionToken;
    };
    /**
     * Cancel a subscription
     * @param subscriptionToken Subscription token returned by `subscribe()`
     */
    WETH9Contract.prototype.unsubscribe = function (subscriptionToken) {
        this._subscriptionManager.unsubscribe(subscriptionToken);
    };
    /**
     * Cancels all existing subscriptions
     */
    WETH9Contract.prototype.unsubscribeAll = function () {
        this._subscriptionManager.unsubscribeAll();
    };
    /**
     * Gets historical logs without creating a subscription
     * @param eventName The WETH9 contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    WETH9Contract.prototype.getLogsAsync = function (eventName, blockRange, indexFilterValues) {
        return __awaiter(this, void 0, void 0, function () {
            var logs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert_1.assert.doesBelongToStringEnum('eventName', eventName, WETH9Events);
                        assert_1.assert.doesConformToSchema('blockRange', blockRange, json_schemas_1.schemas.blockRangeSchema);
                        assert_1.assert.doesConformToSchema('indexFilterValues', indexFilterValues, json_schemas_1.schemas.indexFilterValuesSchema);
                        return [4 /*yield*/, this._subscriptionManager.getLogsAsync(this.address, eventName, blockRange, indexFilterValues, WETH9Contract.ABI())];
                    case 1:
                        logs = _a.sent();
                        return [2 /*return*/, logs];
                }
            });
        });
    };
    WETH9Contract.contractName = 'WETH9';
    return WETH9Contract;
}(base_contract_1.BaseContract));
exports.WETH9Contract = WETH9Contract;
// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
//# sourceMappingURL=weth9.js.map