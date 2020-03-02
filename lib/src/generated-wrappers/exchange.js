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
var ExchangeEvents;
(function (ExchangeEvents) {
    ExchangeEvents["AssetProxyRegistered"] = "AssetProxyRegistered";
    ExchangeEvents["Cancel"] = "Cancel";
    ExchangeEvents["CancelUpTo"] = "CancelUpTo";
    ExchangeEvents["Fill"] = "Fill";
    ExchangeEvents["OwnershipTransferred"] = "OwnershipTransferred";
    ExchangeEvents["ProtocolFeeCollectorAddress"] = "ProtocolFeeCollectorAddress";
    ExchangeEvents["ProtocolFeeMultiplier"] = "ProtocolFeeMultiplier";
    ExchangeEvents["SignatureValidatorApproval"] = "SignatureValidatorApproval";
    ExchangeEvents["TransactionExecution"] = "TransactionExecution";
})(ExchangeEvents = exports.ExchangeEvents || (exports.ExchangeEvents = {}));
/* istanbul ignore next */
// tslint:disable:array-type
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
var ExchangeContract = /** @class */ (function (_super) {
    __extends(ExchangeContract, _super);
    function ExchangeContract(address, supportedProvider, txDefaults, logDecodeDependencies, deployedBytecode) {
        if (deployedBytecode === void 0) { deployedBytecode = ExchangeContract.deployedBytecode; }
        var _this = _super.call(this, 'Exchange', ExchangeContract.ABI(), address, supportedProvider, txDefaults, logDecodeDependencies, deployedBytecode) || this;
        _this._methodABIIndex = {};
        utils_1.classUtils.bindAll(_this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        _this._subscriptionManager = new base_contract_1.SubscriptionManager(ExchangeContract.ABI(), _this._web3Wrapper);
        ExchangeContract.ABI().forEach(function (item, index) {
            if (item.type === 'function') {
                var methodAbi = item;
                _this._methodABIIndex[methodAbi.name] = index;
            }
        });
        return _this;
    }
    ExchangeContract.deployFrom0xArtifactAsync = function (artifact, supportedProvider, txDefaults, logDecodeDependencies, chainId) {
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
                return [2 /*return*/, ExchangeContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly, chainId)];
            });
        });
    };
    ExchangeContract.deployWithLibrariesFrom0xArtifactAsync = function (artifact, libraryArtifacts, supportedProvider, txDefaults, logDecodeDependencies, chainId) {
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
                        return [4 /*yield*/, ExchangeContract._deployLibrariesAsync(artifact, libraryArtifacts, new web3_wrapper_1.Web3Wrapper(provider), txDefaults)];
                    case 1:
                        libraryAddresses = _d.sent();
                        bytecode = base_contract_1.linkLibrariesInBytecode(artifact, libraryAddresses);
                        return [2 /*return*/, ExchangeContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly, chainId)];
                }
            });
        });
    };
    ExchangeContract.deployAsync = function (bytecode, abi, supportedProvider, txDefaults, logDecodeDependencies, chainId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, provider, constructorAbi, iface, deployInfo, txData, web3Wrapper, txDataWithDefaults, txHash, txReceipt, contractInstance;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        assert_1.assert.isHexString('bytecode', bytecode);
                        assert_1.assert.doesConformToSchema('txDefaults', txDefaults, json_schemas_1.schemas.txDataSchema, [
                            json_schemas_1.schemas.addressSchema,
                            json_schemas_1.schemas.numberSchema,
                            json_schemas_1.schemas.jsNumber,
                        ]);
                        provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
                        constructorAbi = base_contract_1.BaseContract._lookupConstructorAbi(abi);
                        _a = __read(base_contract_1.BaseContract._formatABIDataItemList(constructorAbi.inputs, [chainId], base_contract_1.BaseContract._bigNumberToString), 1), chainId = _a[0];
                        iface = new ethers.utils.Interface(abi);
                        deployInfo = iface.deployFunction;
                        txData = deployInfo.encode(bytecode, [chainId]);
                        web3Wrapper = new web3_wrapper_1.Web3Wrapper(provider);
                        return [4 /*yield*/, base_contract_1.BaseContract._applyDefaultsToContractTxDataAsync(__assign({ data: txData }, txDefaults), web3Wrapper.estimateGasAsync.bind(web3Wrapper))];
                    case 1:
                        txDataWithDefaults = _b.sent();
                        return [4 /*yield*/, web3Wrapper.sendTransactionAsync(txDataWithDefaults)];
                    case 2:
                        txHash = _b.sent();
                        utils_1.logUtils.log("transactionHash: " + txHash);
                        return [4 /*yield*/, web3Wrapper.awaitTransactionSuccessAsync(txHash)];
                    case 3:
                        txReceipt = _b.sent();
                        utils_1.logUtils.log("Exchange successfully deployed at " + txReceipt.contractAddress);
                        contractInstance = new ExchangeContract(txReceipt.contractAddress, provider, txDefaults, logDecodeDependencies);
                        contractInstance.constructorArgs = [chainId];
                        return [2 /*return*/, contractInstance];
                }
            });
        });
    };
    /**
     * @returns      The contract ABI
     */
    ExchangeContract.ABI = function () {
        var abi = [
            {
                inputs: [
                    {
                        name: 'chainId',
                        type: 'uint256',
                    },
                ],
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'id',
                        type: 'bytes4',
                        indexed: false,
                    },
                    {
                        name: 'assetProxy',
                        type: 'address',
                        indexed: false,
                    },
                ],
                name: 'AssetProxyRegistered',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'makerAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'feeRecipientAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'makerAssetData',
                        type: 'bytes',
                        indexed: false,
                    },
                    {
                        name: 'takerAssetData',
                        type: 'bytes',
                        indexed: false,
                    },
                    {
                        name: 'senderAddress',
                        type: 'address',
                        indexed: false,
                    },
                    {
                        name: 'orderHash',
                        type: 'bytes32',
                        indexed: true,
                    },
                ],
                name: 'Cancel',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'makerAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'orderSenderAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'orderEpoch',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'CancelUpTo',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'makerAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'feeRecipientAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'makerAssetData',
                        type: 'bytes',
                        indexed: false,
                    },
                    {
                        name: 'takerAssetData',
                        type: 'bytes',
                        indexed: false,
                    },
                    {
                        name: 'makerFeeAssetData',
                        type: 'bytes',
                        indexed: false,
                    },
                    {
                        name: 'takerFeeAssetData',
                        type: 'bytes',
                        indexed: false,
                    },
                    {
                        name: 'orderHash',
                        type: 'bytes32',
                        indexed: true,
                    },
                    {
                        name: 'takerAddress',
                        type: 'address',
                        indexed: false,
                    },
                    {
                        name: 'senderAddress',
                        type: 'address',
                        indexed: false,
                    },
                    {
                        name: 'makerAssetFilledAmount',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'takerAssetFilledAmount',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'makerFeePaid',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'takerFeePaid',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'protocolFeePaid',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'Fill',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'previousOwner',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'newOwner',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'OwnershipTransferred',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'oldProtocolFeeCollector',
                        type: 'address',
                        indexed: false,
                    },
                    {
                        name: 'updatedProtocolFeeCollector',
                        type: 'address',
                        indexed: false,
                    },
                ],
                name: 'ProtocolFeeCollectorAddress',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'oldProtocolFeeMultiplier',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'updatedProtocolFeeMultiplier',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'ProtocolFeeMultiplier',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'signerAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'validatorAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'isApproved',
                        type: 'bool',
                        indexed: false,
                    },
                ],
                name: 'SignatureValidatorApproval',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'transactionHash',
                        type: 'bytes32',
                        indexed: true,
                    },
                ],
                name: 'TransactionExecution',
                outputs: [],
                type: 'event',
            },
            {
                constant: true,
                inputs: [],
                name: 'EIP1271_MAGIC_VALUE',
                outputs: [
                    {
                        name: '',
                        type: 'bytes4',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'EIP712_EXCHANGE_DOMAIN_HASH',
                outputs: [
                    {
                        name: '',
                        type: 'bytes32',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
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
                name: 'allowedValidators',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
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
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                ],
                name: 'batchCancelOrders',
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'transactions',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'gasPrice',
                                type: 'uint256',
                            },
                            {
                                name: 'signerAddress',
                                type: 'address',
                            },
                            {
                                name: 'data',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'batchExecuteTransactions',
                outputs: [
                    {
                        name: 'returnData',
                        type: 'bytes[]',
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'takerAssetFillAmounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'batchFillOrKillOrders',
                outputs: [
                    {
                        name: 'fillResults',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'protocolFeePaid',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'takerAssetFillAmounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'batchFillOrders',
                outputs: [
                    {
                        name: 'fillResults',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'protocolFeePaid',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'takerAssetFillAmounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'batchFillOrdersNoThrow',
                outputs: [
                    {
                        name: 'fillResults',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'protocolFeePaid',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'leftOrders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'rightOrders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'leftSignatures',
                        type: 'bytes[]',
                    },
                    {
                        name: 'rightSignatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'batchMatchOrders',
                outputs: [
                    {
                        name: 'batchMatchedFillResults',
                        type: 'tuple',
                        components: [
                            {
                                name: 'left',
                                type: 'tuple[]',
                                components: [
                                    {
                                        name: 'makerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'makerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'protocolFeePaid',
                                        type: 'uint256',
                                    },
                                ],
                            },
                            {
                                name: 'right',
                                type: 'tuple[]',
                                components: [
                                    {
                                        name: 'makerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'makerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'protocolFeePaid',
                                        type: 'uint256',
                                    },
                                ],
                            },
                            {
                                name: 'profitInLeftMakerAsset',
                                type: 'uint256',
                            },
                            {
                                name: 'profitInRightMakerAsset',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'leftOrders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'rightOrders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'leftSignatures',
                        type: 'bytes[]',
                    },
                    {
                        name: 'rightSignatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'batchMatchOrdersWithMaximalFill',
                outputs: [
                    {
                        name: 'batchMatchedFillResults',
                        type: 'tuple',
                        components: [
                            {
                                name: 'left',
                                type: 'tuple[]',
                                components: [
                                    {
                                        name: 'makerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'makerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'protocolFeePaid',
                                        type: 'uint256',
                                    },
                                ],
                            },
                            {
                                name: 'right',
                                type: 'tuple[]',
                                components: [
                                    {
                                        name: 'makerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'makerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'protocolFeePaid',
                                        type: 'uint256',
                                    },
                                ],
                            },
                            {
                                name: 'profitInLeftMakerAsset',
                                type: 'uint256',
                            },
                            {
                                name: 'profitInRightMakerAsset',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'order',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                ],
                name: 'cancelOrder',
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'targetOrderEpoch',
                        type: 'uint256',
                    },
                ],
                name: 'cancelOrdersUpTo',
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'bytes32',
                    },
                ],
                name: 'cancelled',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'currentContextAddress',
                outputs: [
                    {
                        name: '',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [],
                name: 'detachProtocolFeeCollector',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'transaction',
                        type: 'tuple',
                        components: [
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'gasPrice',
                                type: 'uint256',
                            },
                            {
                                name: 'signerAddress',
                                type: 'address',
                            },
                            {
                                name: 'data',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'executeTransaction',
                outputs: [
                    {
                        name: '',
                        type: 'bytes',
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'order',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'takerAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'fillOrKillOrder',
                outputs: [
                    {
                        name: 'fillResults',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'protocolFeePaid',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'order',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'takerAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'fillOrder',
                outputs: [
                    {
                        name: 'fillResults',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'protocolFeePaid',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'bytes32',
                    },
                ],
                name: 'filled',
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
                inputs: [
                    {
                        name: 'assetProxyId',
                        type: 'bytes4',
                    },
                ],
                name: 'getAssetProxy',
                outputs: [
                    {
                        name: 'assetProxy',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'order',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                ],
                name: 'getOrderInfo',
                outputs: [
                    {
                        name: 'orderInfo',
                        type: 'tuple',
                        components: [
                            {
                                name: 'orderStatus',
                                type: 'uint8',
                            },
                            {
                                name: 'orderHash',
                                type: 'bytes32',
                            },
                            {
                                name: 'orderTakerAssetFilledAmount',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'hash',
                        type: 'bytes32',
                    },
                    {
                        name: 'signerAddress',
                        type: 'address',
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'isValidHashSignature',
                outputs: [
                    {
                        name: 'isValid',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'order',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'isValidOrderSignature',
                outputs: [
                    {
                        name: 'isValid',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'transaction',
                        type: 'tuple',
                        components: [
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'gasPrice',
                                type: 'uint256',
                            },
                            {
                                name: 'signerAddress',
                                type: 'address',
                            },
                            {
                                name: 'data',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'isValidTransactionSignature',
                outputs: [
                    {
                        name: 'isValid',
                        type: 'bool',
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
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'makerAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'marketBuyOrdersFillOrKill',
                outputs: [
                    {
                        name: 'fillResults',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'protocolFeePaid',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'makerAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'marketBuyOrdersNoThrow',
                outputs: [
                    {
                        name: 'fillResults',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'protocolFeePaid',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'takerAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'marketSellOrdersFillOrKill',
                outputs: [
                    {
                        name: 'fillResults',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'protocolFeePaid',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'takerAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'marketSellOrdersNoThrow',
                outputs: [
                    {
                        name: 'fillResults',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetFilledAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFeePaid',
                                type: 'uint256',
                            },
                            {
                                name: 'protocolFeePaid',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'leftOrder',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'rightOrder',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'leftSignature',
                        type: 'bytes',
                    },
                    {
                        name: 'rightSignature',
                        type: 'bytes',
                    },
                ],
                name: 'matchOrders',
                outputs: [
                    {
                        name: 'matchedFillResults',
                        type: 'tuple',
                        components: [
                            {
                                name: 'left',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'makerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'makerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'protocolFeePaid',
                                        type: 'uint256',
                                    },
                                ],
                            },
                            {
                                name: 'right',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'makerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'makerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'protocolFeePaid',
                                        type: 'uint256',
                                    },
                                ],
                            },
                            {
                                name: 'profitInLeftMakerAsset',
                                type: 'uint256',
                            },
                            {
                                name: 'profitInRightMakerAsset',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'leftOrder',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'rightOrder',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'leftSignature',
                        type: 'bytes',
                    },
                    {
                        name: 'rightSignature',
                        type: 'bytes',
                    },
                ],
                name: 'matchOrdersWithMaximalFill',
                outputs: [
                    {
                        name: 'matchedFillResults',
                        type: 'tuple',
                        components: [
                            {
                                name: 'left',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'makerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'makerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'protocolFeePaid',
                                        type: 'uint256',
                                    },
                                ],
                            },
                            {
                                name: 'right',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'makerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'makerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'protocolFeePaid',
                                        type: 'uint256',
                                    },
                                ],
                            },
                            {
                                name: 'profitInLeftMakerAsset',
                                type: 'uint256',
                            },
                            {
                                name: 'profitInRightMakerAsset',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
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
                name: 'orderEpoch',
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
                name: 'owner',
                outputs: [
                    {
                        name: '',
                        type: 'address',
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
                        name: 'hash',
                        type: 'bytes32',
                    },
                ],
                name: 'preSign',
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'bytes32',
                    },
                    {
                        name: 'index_1',
                        type: 'address',
                    },
                ],
                name: 'preSigned',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'protocolFeeCollector',
                outputs: [
                    {
                        name: '',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'protocolFeeMultiplier',
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
                        name: 'assetProxy',
                        type: 'address',
                    },
                ],
                name: 'registerAssetProxy',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'updatedProtocolFeeCollector',
                        type: 'address',
                    },
                ],
                name: 'setProtocolFeeCollectorAddress',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'updatedProtocolFeeMultiplier',
                        type: 'uint256',
                    },
                ],
                name: 'setProtocolFeeMultiplier',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'validatorAddress',
                        type: 'address',
                    },
                    {
                        name: 'approval',
                        type: 'bool',
                    },
                ],
                name: 'setSignatureValidatorApproval',
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'assetData',
                        type: 'bytes[]',
                    },
                    {
                        name: 'fromAddresses',
                        type: 'address[]',
                    },
                    {
                        name: 'toAddresses',
                        type: 'address[]',
                    },
                    {
                        name: 'amounts',
                        type: 'uint256[]',
                    },
                ],
                name: 'simulateDispatchTransferFromCalls',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'bytes32',
                    },
                ],
                name: 'transactionsExecuted',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
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
                        name: 'newOwner',
                        type: 'address',
                    },
                ],
                name: 'transferOwnership',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
        ];
        return abi;
    };
    ExchangeContract._deployLibrariesAsync = function (artifact, libraryArtifacts, web3Wrapper, txDefaults, libraryAddresses) {
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
                        return [4 /*yield*/, ExchangeContract._deployLibrariesAsync(libraryArtifact, libraryArtifacts, web3Wrapper, txDefaults, libraryAddresses)];
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
    ExchangeContract.prototype.getFunctionSignature = function (methodName) {
        var index = this._methodABIIndex[methodName];
        var methodAbi = ExchangeContract.ABI()[index]; // tslint:disable-line:no-unnecessary-type-assertion
        var functionSignature = base_contract_1.methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    };
    ExchangeContract.prototype.getABIDecodedTransactionData = function (methodName, callData) {
        var functionSignature = this.getFunctionSignature(methodName);
        var self = this;
        var abiEncoder = self._lookupAbiEncoder(functionSignature);
        var abiDecodedCallData = abiEncoder.strictDecode(callData);
        return abiDecodedCallData;
    };
    ExchangeContract.prototype.getABIDecodedReturnData = function (methodName, callData) {
        var functionSignature = this.getFunctionSignature(methodName);
        var self = this;
        var abiEncoder = self._lookupAbiEncoder(functionSignature);
        var abiDecodedCallData = abiEncoder.strictDecodeReturnValue(callData);
        return abiDecodedCallData;
    };
    ExchangeContract.prototype.getSelector = function (methodName) {
        var functionSignature = this.getFunctionSignature(methodName);
        var self = this;
        var abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    };
    ExchangeContract.prototype.EIP1271_MAGIC_VALUE = function () {
        var self = this;
        var functionSignature = 'EIP1271_MAGIC_VALUE()';
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
    ExchangeContract.prototype.EIP712_EXCHANGE_DOMAIN_HASH = function () {
        var self = this;
        var functionSignature = 'EIP712_EXCHANGE_DOMAIN_HASH()';
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
    ExchangeContract.prototype.allowedValidators = function (index_0, index_1) {
        var self = this;
        assert_1.assert.isString('index_0', index_0);
        assert_1.assert.isString('index_1', index_1);
        var functionSignature = 'allowedValidators(address,address)';
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
    /**
     * Executes multiple calls of cancelOrder.
     * @param orders Array of order specifications.
     */
    ExchangeContract.prototype.batchCancelOrders = function (orders) {
        var self = this;
        assert_1.assert.isArray('orders', orders);
        var functionSignature = 'batchCancelOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[])';
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
                return self._strictEncodeArguments(functionSignature, [orders]);
            },
        };
    };
    /**
     * Executes a batch of Exchange method calls in the context of signer(s).
     * @param transactions Array of 0x transaction structures.
     * @param signatures Array of proofs that transactions have been signed by
     *     signer(s).
     * @returns returnData Array containing ABI encoded return data for each of the underlying Exchange function calls.
     */
    ExchangeContract.prototype.batchExecuteTransactions = function (transactions, signatures) {
        var self = this;
        assert_1.assert.isArray('transactions', transactions);
        assert_1.assert.isArray('signatures', signatures);
        var functionSignature = 'batchExecuteTransactions((uint256,uint256,uint256,address,bytes)[],bytes[])';
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
                return self._strictEncodeArguments(functionSignature, [transactions, signatures]);
            },
        };
    };
    /**
     * Executes multiple calls of fillOrKillOrder.
     * @param orders Array of order specifications.
     * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
     *     in orders.
     * @param signatures Proofs that orders have been created by makers.
     * @returns fillResults Array of amounts filled and fees paid by makers and taker.
     */
    ExchangeContract.prototype.batchFillOrKillOrders = function (orders, takerAssetFillAmounts, signatures) {
        var self = this;
        assert_1.assert.isArray('orders', orders);
        assert_1.assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
        assert_1.assert.isArray('signatures', signatures);
        var functionSignature = 'batchFillOrKillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256[],bytes[])';
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
                return self._strictEncodeArguments(functionSignature, [orders, takerAssetFillAmounts, signatures]);
            },
        };
    };
    /**
     * Executes multiple calls of fillOrder.
     * @param orders Array of order specifications.
     * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
     *     in orders.
     * @param signatures Proofs that orders have been created by makers.
     * @returns fillResults Array of amounts filled and fees paid by makers and taker.
     */
    ExchangeContract.prototype.batchFillOrders = function (orders, takerAssetFillAmounts, signatures) {
        var self = this;
        assert_1.assert.isArray('orders', orders);
        assert_1.assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
        assert_1.assert.isArray('signatures', signatures);
        var functionSignature = 'batchFillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256[],bytes[])';
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
                return self._strictEncodeArguments(functionSignature, [orders, takerAssetFillAmounts, signatures]);
            },
        };
    };
    /**
     * Executes multiple calls of fillOrder. If any fill reverts, the error is caught and ignored.
     * @param orders Array of order specifications.
     * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
     *     in orders.
     * @param signatures Proofs that orders have been created by makers.
     * @returns fillResults Array of amounts filled and fees paid by makers and taker.
     */
    ExchangeContract.prototype.batchFillOrdersNoThrow = function (orders, takerAssetFillAmounts, signatures) {
        var self = this;
        assert_1.assert.isArray('orders', orders);
        assert_1.assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
        assert_1.assert.isArray('signatures', signatures);
        var functionSignature = 'batchFillOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256[],bytes[])';
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
                return self._strictEncodeArguments(functionSignature, [orders, takerAssetFillAmounts, signatures]);
            },
        };
    };
    /**
     * Match complementary orders that have a profitable spread.
     * Each order is filled at their respective price point, and
     * the matcher receives a profit denominated in the left maker asset.
     * @param leftOrders Set of orders with the same maker / taker asset.
     * @param rightOrders Set of orders to match against `leftOrders`
     * @param leftSignatures Proof that left orders were created by the left
     *     makers.
     * @param rightSignatures Proof that right orders were created by the right
     *     makers.
     * @returns batchMatchedFillResults Amounts filled and profit generated.
     */
    ExchangeContract.prototype.batchMatchOrders = function (leftOrders, rightOrders, leftSignatures, rightSignatures) {
        var self = this;
        assert_1.assert.isArray('leftOrders', leftOrders);
        assert_1.assert.isArray('rightOrders', rightOrders);
        assert_1.assert.isArray('leftSignatures', leftSignatures);
        assert_1.assert.isArray('rightSignatures', rightSignatures);
        var functionSignature = 'batchMatchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],bytes[])';
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
                return self._strictEncodeArguments(functionSignature, [
                    leftOrders,
                    rightOrders,
                    leftSignatures,
                    rightSignatures,
                ]);
            },
        };
    };
    /**
     * Match complementary orders that have a profitable spread.
     * Each order is maximally filled at their respective price point, and
     * the matcher receives a profit denominated in either the left maker asset,
     * right maker asset, or a combination of both.
     * @param leftOrders Set of orders with the same maker / taker asset.
     * @param rightOrders Set of orders to match against `leftOrders`
     * @param leftSignatures Proof that left orders were created by the left
     *     makers.
     * @param rightSignatures Proof that right orders were created by the right
     *     makers.
     * @returns batchMatchedFillResults Amounts filled and profit generated.
     */
    ExchangeContract.prototype.batchMatchOrdersWithMaximalFill = function (leftOrders, rightOrders, leftSignatures, rightSignatures) {
        var self = this;
        assert_1.assert.isArray('leftOrders', leftOrders);
        assert_1.assert.isArray('rightOrders', rightOrders);
        assert_1.assert.isArray('leftSignatures', leftSignatures);
        assert_1.assert.isArray('rightSignatures', rightSignatures);
        var functionSignature = 'batchMatchOrdersWithMaximalFill((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],bytes[])';
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
                return self._strictEncodeArguments(functionSignature, [
                    leftOrders,
                    rightOrders,
                    leftSignatures,
                    rightSignatures,
                ]);
            },
        };
    };
    /**
     * After calling, the order can not be filled anymore.
     * @param order Order struct containing order specifications.
     */
    ExchangeContract.prototype.cancelOrder = function (order) {
        var self = this;
        var functionSignature = 'cancelOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes))';
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
                return self._strictEncodeArguments(functionSignature, [order]);
            },
        };
    };
    /**
     * Cancels all orders created by makerAddress with a salt less than or equal to the targetOrderEpoch
     * and senderAddress equal to msg.sender (or null address if msg.sender == makerAddress).
     * @param targetOrderEpoch Orders created with a salt less or equal to this
     *     value will be cancelled.
     */
    ExchangeContract.prototype.cancelOrdersUpTo = function (targetOrderEpoch) {
        var self = this;
        assert_1.assert.isBigNumber('targetOrderEpoch', targetOrderEpoch);
        var functionSignature = 'cancelOrdersUpTo(uint256)';
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
                return self._strictEncodeArguments(functionSignature, [targetOrderEpoch]);
            },
        };
    };
    ExchangeContract.prototype.cancelled = function (index_0) {
        var self = this;
        assert_1.assert.isString('index_0', index_0);
        var functionSignature = 'cancelled(bytes32)';
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
                return self._strictEncodeArguments(functionSignature, [index_0]);
            },
        };
    };
    ExchangeContract.prototype.currentContextAddress = function () {
        var self = this;
        var functionSignature = 'currentContextAddress()';
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
    /**
     * Sets the protocolFeeCollector contract address to 0.
     * Only callable by owner.
     */
    ExchangeContract.prototype.detachProtocolFeeCollector = function () {
        var self = this;
        var functionSignature = 'detachProtocolFeeCollector()';
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
    /**
     * Executes an Exchange method call in the context of signer.
     * @param transaction 0x transaction structure.
     * @param signature Proof that transaction has been signed by signer.
     * @returns ABI encoded return data of the underlying Exchange function call.
     */
    ExchangeContract.prototype.executeTransaction = function (transaction, signature) {
        var self = this;
        assert_1.assert.isString('signature', signature);
        var functionSignature = 'executeTransaction((uint256,uint256,uint256,address,bytes),bytes)';
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
                return self._strictEncodeArguments(functionSignature, [transaction, signature]);
            },
        };
    };
    /**
     * Fills the input order. Reverts if exact `takerAssetFillAmount` not filled.
     * @param order Order struct containing order specifications.
     * @param takerAssetFillAmount Desired amount of takerAsset to sell.
     * @param signature Proof that order has been created by maker.
     * @returns fillResults Amounts filled and fees paid.
     */
    ExchangeContract.prototype.fillOrKillOrder = function (order, takerAssetFillAmount, signature) {
        var self = this;
        assert_1.assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        assert_1.assert.isString('signature', signature);
        var functionSignature = 'fillOrKillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),uint256,bytes)';
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
                return self._strictEncodeArguments(functionSignature, [order, takerAssetFillAmount, signature]);
            },
        };
    };
    /**
     * Fills the input order.
     * @param order Order struct containing order specifications.
     * @param takerAssetFillAmount Desired amount of takerAsset to sell.
     * @param signature Proof that order has been created by maker.
     * @returns fillResults Amounts filled and fees paid by maker and taker.
     */
    ExchangeContract.prototype.fillOrder = function (order, takerAssetFillAmount, signature) {
        var self = this;
        assert_1.assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        assert_1.assert.isString('signature', signature);
        var functionSignature = 'fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),uint256,bytes)';
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
                return self._strictEncodeArguments(functionSignature, [order, takerAssetFillAmount, signature]);
            },
        };
    };
    ExchangeContract.prototype.filled = function (index_0) {
        var self = this;
        assert_1.assert.isString('index_0', index_0);
        var functionSignature = 'filled(bytes32)';
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
                return self._strictEncodeArguments(functionSignature, [index_0]);
            },
        };
    };
    /**
     * Gets an asset proxy.
     * @param assetProxyId Id of the asset proxy.
     * @returns assetProxy The asset proxy address registered to assetProxyId. Returns 0x0 if no proxy is registered.
     */
    ExchangeContract.prototype.getAssetProxy = function (assetProxyId) {
        var self = this;
        assert_1.assert.isString('assetProxyId', assetProxyId);
        var functionSignature = 'getAssetProxy(bytes4)';
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
                return self._strictEncodeArguments(functionSignature, [assetProxyId]);
            },
        };
    };
    /**
     * Gets information about an order: status, hash, and amount filled.
     * @param order Order to gather information on.
     * @returns orderInfo Information about the order and its state.         See LibOrder.OrderInfo for a complete description.
     */
    ExchangeContract.prototype.getOrderInfo = function (order) {
        var self = this;
        var functionSignature = 'getOrderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes))';
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
                return self._strictEncodeArguments(functionSignature, [order]);
            },
        };
    };
    /**
     * Verifies that a hash has been signed by the given signer.
     * @param hash Any 32-byte hash.
     * @param signerAddress Address that should have signed the given hash.
     * @param signature Proof that the hash has been signed by signer.
     * @returns isValid &#x60;true&#x60; if the signature is valid for the given hash and signer.
     */
    ExchangeContract.prototype.isValidHashSignature = function (hash, signerAddress, signature) {
        var self = this;
        assert_1.assert.isString('hash', hash);
        assert_1.assert.isString('signerAddress', signerAddress);
        assert_1.assert.isString('signature', signature);
        var functionSignature = 'isValidHashSignature(bytes32,address,bytes)';
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
                return self._strictEncodeArguments(functionSignature, [hash, signerAddress.toLowerCase(), signature]);
            },
        };
    };
    /**
     * Verifies that a signature for an order is valid.
     * @param order The order.
     * @param signature Proof that the order has been signed by signer.
     * @returns isValid &#x60;true&#x60; if the signature is valid for the given order and signer.
     */
    ExchangeContract.prototype.isValidOrderSignature = function (order, signature) {
        var self = this;
        assert_1.assert.isString('signature', signature);
        var functionSignature = 'isValidOrderSignature((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),bytes)';
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
                return self._strictEncodeArguments(functionSignature, [order, signature]);
            },
        };
    };
    /**
     * Verifies that a signature for a transaction is valid.
     * @param transaction The transaction.
     * @param signature Proof that the order has been signed by signer.
     * @returns isValid &#x60;true&#x60; if the signature is valid for the given transaction and signer.
     */
    ExchangeContract.prototype.isValidTransactionSignature = function (transaction, signature) {
        var self = this;
        assert_1.assert.isString('signature', signature);
        var functionSignature = 'isValidTransactionSignature((uint256,uint256,uint256,address,bytes),bytes)';
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
                return self._strictEncodeArguments(functionSignature, [transaction, signature]);
            },
        };
    };
    /**
     * Calls marketBuyOrdersNoThrow then reverts if < makerAssetFillAmount has been bought.
     * NOTE: This function does not enforce that the makerAsset is the same for each order.
     * @param orders Array of order specifications.
     * @param makerAssetFillAmount Minimum amount of makerAsset to buy.
     * @param signatures Proofs that orders have been signed by makers.
     * @returns fillResults Amounts filled and fees paid by makers and taker.
     */
    ExchangeContract.prototype.marketBuyOrdersFillOrKill = function (orders, makerAssetFillAmount, signatures) {
        var self = this;
        assert_1.assert.isArray('orders', orders);
        assert_1.assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
        assert_1.assert.isArray('signatures', signatures);
        var functionSignature = 'marketBuyOrdersFillOrKill((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[])';
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
                return self._strictEncodeArguments(functionSignature, [orders, makerAssetFillAmount, signatures]);
            },
        };
    };
    /**
     * Executes multiple calls of fillOrder until total amount of makerAsset is bought by taker.
     * If any fill reverts, the error is caught and ignored.
     * NOTE: This function does not enforce that the makerAsset is the same for each order.
     * @param orders Array of order specifications.
     * @param makerAssetFillAmount Desired amount of makerAsset to buy.
     * @param signatures Proofs that orders have been signed by makers.
     * @returns fillResults Amounts filled and fees paid by makers and taker.
     */
    ExchangeContract.prototype.marketBuyOrdersNoThrow = function (orders, makerAssetFillAmount, signatures) {
        var self = this;
        assert_1.assert.isArray('orders', orders);
        assert_1.assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
        assert_1.assert.isArray('signatures', signatures);
        var functionSignature = 'marketBuyOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[])';
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
                return self._strictEncodeArguments(functionSignature, [orders, makerAssetFillAmount, signatures]);
            },
        };
    };
    /**
     * Calls marketSellOrdersNoThrow then reverts if < takerAssetFillAmount has been sold.
     * NOTE: This function does not enforce that the takerAsset is the same for each order.
     * @param orders Array of order specifications.
     * @param takerAssetFillAmount Minimum amount of takerAsset to sell.
     * @param signatures Proofs that orders have been signed by makers.
     * @returns fillResults Amounts filled and fees paid by makers and taker.
     */
    ExchangeContract.prototype.marketSellOrdersFillOrKill = function (orders, takerAssetFillAmount, signatures) {
        var self = this;
        assert_1.assert.isArray('orders', orders);
        assert_1.assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        assert_1.assert.isArray('signatures', signatures);
        var functionSignature = 'marketSellOrdersFillOrKill((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[])';
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
                return self._strictEncodeArguments(functionSignature, [orders, takerAssetFillAmount, signatures]);
            },
        };
    };
    /**
     * Executes multiple calls of fillOrder until total amount of takerAsset is sold by taker.
     * If any fill reverts, the error is caught and ignored.
     * NOTE: This function does not enforce that the takerAsset is the same for each order.
     * @param orders Array of order specifications.
     * @param takerAssetFillAmount Desired amount of takerAsset to sell.
     * @param signatures Proofs that orders have been signed by makers.
     * @returns fillResults Amounts filled and fees paid by makers and taker.
     */
    ExchangeContract.prototype.marketSellOrdersNoThrow = function (orders, takerAssetFillAmount, signatures) {
        var self = this;
        assert_1.assert.isArray('orders', orders);
        assert_1.assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        assert_1.assert.isArray('signatures', signatures);
        var functionSignature = 'marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[])';
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
                return self._strictEncodeArguments(functionSignature, [orders, takerAssetFillAmount, signatures]);
            },
        };
    };
    /**
     * Match two complementary orders that have a profitable spread.
     * Each order is filled at their respective price point. However, the calculations are
     * carried out as though the orders are both being filled at the right order's price point.
     * The profit made by the left order goes to the taker (who matched the two orders).
     * @param leftOrder First order to match.
     * @param rightOrder Second order to match.
     * @param leftSignature Proof that order was created by the left maker.
     * @param rightSignature Proof that order was created by the right maker.
     * @returns matchedFillResults Amounts filled and fees paid by maker and taker of matched orders.
     */
    ExchangeContract.prototype.matchOrders = function (leftOrder, rightOrder, leftSignature, rightSignature) {
        var self = this;
        assert_1.assert.isString('leftSignature', leftSignature);
        assert_1.assert.isString('rightSignature', rightSignature);
        var functionSignature = 'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),bytes,bytes)';
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
                return self._strictEncodeArguments(functionSignature, [
                    leftOrder,
                    rightOrder,
                    leftSignature,
                    rightSignature,
                ]);
            },
        };
    };
    /**
     * Match two complementary orders that have a profitable spread.
     * Each order is maximally filled at their respective price point, and
     * the matcher receives a profit denominated in either the left maker asset,
     * right maker asset, or a combination of both.
     * @param leftOrder First order to match.
     * @param rightOrder Second order to match.
     * @param leftSignature Proof that order was created by the left maker.
     * @param rightSignature Proof that order was created by the right maker.
     * @returns matchedFillResults Amounts filled by maker and taker of matched orders.
     */
    ExchangeContract.prototype.matchOrdersWithMaximalFill = function (leftOrder, rightOrder, leftSignature, rightSignature) {
        var self = this;
        assert_1.assert.isString('leftSignature', leftSignature);
        assert_1.assert.isString('rightSignature', rightSignature);
        var functionSignature = 'matchOrdersWithMaximalFill((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),bytes,bytes)';
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
                return self._strictEncodeArguments(functionSignature, [
                    leftOrder,
                    rightOrder,
                    leftSignature,
                    rightSignature,
                ]);
            },
        };
    };
    ExchangeContract.prototype.orderEpoch = function (index_0, index_1) {
        var self = this;
        assert_1.assert.isString('index_0', index_0);
        assert_1.assert.isString('index_1', index_1);
        var functionSignature = 'orderEpoch(address,address)';
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
    ExchangeContract.prototype.owner = function () {
        var self = this;
        var functionSignature = 'owner()';
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
    /**
     * Approves a hash on-chain.
     * After presigning a hash, the preSign signature type will become valid for that hash and signer.
     * @param hash Any 32-byte hash.
     */
    ExchangeContract.prototype.preSign = function (hash) {
        var self = this;
        assert_1.assert.isString('hash', hash);
        var functionSignature = 'preSign(bytes32)';
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
                return self._strictEncodeArguments(functionSignature, [hash]);
            },
        };
    };
    ExchangeContract.prototype.preSigned = function (index_0, index_1) {
        var self = this;
        assert_1.assert.isString('index_0', index_0);
        assert_1.assert.isString('index_1', index_1);
        var functionSignature = 'preSigned(bytes32,address)';
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
                return self._strictEncodeArguments(functionSignature, [index_0, index_1.toLowerCase()]);
            },
        };
    };
    ExchangeContract.prototype.protocolFeeCollector = function () {
        var self = this;
        var functionSignature = 'protocolFeeCollector()';
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
    ExchangeContract.prototype.protocolFeeMultiplier = function () {
        var self = this;
        var functionSignature = 'protocolFeeMultiplier()';
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
    /**
     * Registers an asset proxy to its asset proxy id.
     * Once an asset proxy is registered, it cannot be unregistered.
     * @param assetProxy Address of new asset proxy to register.
     */
    ExchangeContract.prototype.registerAssetProxy = function (assetProxy) {
        var self = this;
        assert_1.assert.isString('assetProxy', assetProxy);
        var functionSignature = 'registerAssetProxy(address)';
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
                return self._strictEncodeArguments(functionSignature, [assetProxy.toLowerCase()]);
            },
        };
    };
    /**
     * Allows the owner to update the protocolFeeCollector address.
     * @param updatedProtocolFeeCollector The updated protocolFeeCollector contract
     *     address.
     */
    ExchangeContract.prototype.setProtocolFeeCollectorAddress = function (updatedProtocolFeeCollector) {
        var self = this;
        assert_1.assert.isString('updatedProtocolFeeCollector', updatedProtocolFeeCollector);
        var functionSignature = 'setProtocolFeeCollectorAddress(address)';
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
                return self._strictEncodeArguments(functionSignature, [updatedProtocolFeeCollector.toLowerCase()]);
            },
        };
    };
    /**
     * Allows the owner to update the protocol fee multiplier.
     * @param updatedProtocolFeeMultiplier The updated protocol fee multiplier.
     */
    ExchangeContract.prototype.setProtocolFeeMultiplier = function (updatedProtocolFeeMultiplier) {
        var self = this;
        assert_1.assert.isBigNumber('updatedProtocolFeeMultiplier', updatedProtocolFeeMultiplier);
        var functionSignature = 'setProtocolFeeMultiplier(uint256)';
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
                return self._strictEncodeArguments(functionSignature, [updatedProtocolFeeMultiplier]);
            },
        };
    };
    /**
     * Approves/unnapproves a Validator contract to verify signatures on signer's behalf
     * using the `Validator` signature type.
     * @param validatorAddress Address of Validator contract.
     * @param approval Approval or disapproval of  Validator contract.
     */
    ExchangeContract.prototype.setSignatureValidatorApproval = function (validatorAddress, approval) {
        var self = this;
        assert_1.assert.isString('validatorAddress', validatorAddress);
        assert_1.assert.isBoolean('approval', approval);
        var functionSignature = 'setSignatureValidatorApproval(address,bool)';
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
                return self._strictEncodeArguments(functionSignature, [validatorAddress.toLowerCase(), approval]);
            },
        };
    };
    /**
     * This function may be used to simulate any amount of transfers As they would occur through the Exchange contract. Note that this function will always revert, even if all transfers are successful. However, it may be used with eth_call or with a try/catch pattern in order to simulate the results of the transfers.
     * @param assetData Array of asset details, each encoded per the AssetProxy
     *     contract specification.
     * @param fromAddresses Array containing the `from` addresses that correspond
     *     with each transfer.
     * @param toAddresses Array containing the `to` addresses that correspond with
     *     each transfer.
     * @param amounts Array containing the amounts that correspond to each
     *     transfer.
     * @returns This function does not return a value. However, it will always revert with &#x60;Error(&quot;TRANSFERS_SUCCESSFUL&quot;)&#x60; if all of the transfers were successful.
     */
    ExchangeContract.prototype.simulateDispatchTransferFromCalls = function (assetData, fromAddresses, toAddresses, amounts) {
        var self = this;
        assert_1.assert.isArray('assetData', assetData);
        assert_1.assert.isArray('fromAddresses', fromAddresses);
        assert_1.assert.isArray('toAddresses', toAddresses);
        assert_1.assert.isArray('amounts', amounts);
        var functionSignature = 'simulateDispatchTransferFromCalls(bytes[],address[],address[],uint256[])';
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
                return self._strictEncodeArguments(functionSignature, [assetData, fromAddresses, toAddresses, amounts]);
            },
        };
    };
    ExchangeContract.prototype.transactionsExecuted = function (index_0) {
        var self = this;
        assert_1.assert.isString('index_0', index_0);
        var functionSignature = 'transactionsExecuted(bytes32)';
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
                return self._strictEncodeArguments(functionSignature, [index_0]);
            },
        };
    };
    /**
     * Change the owner of this contract.
     * @param newOwner New owner address.
     */
    ExchangeContract.prototype.transferOwnership = function (newOwner) {
        var self = this;
        assert_1.assert.isString('newOwner', newOwner);
        var functionSignature = 'transferOwnership(address)';
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
                return self._strictEncodeArguments(functionSignature, [newOwner.toLowerCase()]);
            },
        };
    };
    /**
     * Subscribe to an event type emitted by the Exchange contract.
     * @param eventName The Exchange contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    ExchangeContract.prototype.subscribe = function (eventName, indexFilterValues, callback, isVerbose, blockPollingIntervalMs) {
        if (isVerbose === void 0) { isVerbose = false; }
        assert_1.assert.doesBelongToStringEnum('eventName', eventName, ExchangeEvents);
        assert_1.assert.doesConformToSchema('indexFilterValues', indexFilterValues, json_schemas_1.schemas.indexFilterValuesSchema);
        assert_1.assert.isFunction('callback', callback);
        var subscriptionToken = this._subscriptionManager.subscribe(this.address, eventName, indexFilterValues, ExchangeContract.ABI(), callback, isVerbose, blockPollingIntervalMs);
        return subscriptionToken;
    };
    /**
     * Cancel a subscription
     * @param subscriptionToken Subscription token returned by `subscribe()`
     */
    ExchangeContract.prototype.unsubscribe = function (subscriptionToken) {
        this._subscriptionManager.unsubscribe(subscriptionToken);
    };
    /**
     * Cancels all existing subscriptions
     */
    ExchangeContract.prototype.unsubscribeAll = function () {
        this._subscriptionManager.unsubscribeAll();
    };
    /**
     * Gets historical logs without creating a subscription
     * @param eventName The Exchange contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    ExchangeContract.prototype.getLogsAsync = function (eventName, blockRange, indexFilterValues) {
        return __awaiter(this, void 0, void 0, function () {
            var logs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert_1.assert.doesBelongToStringEnum('eventName', eventName, ExchangeEvents);
                        assert_1.assert.doesConformToSchema('blockRange', blockRange, json_schemas_1.schemas.blockRangeSchema);
                        assert_1.assert.doesConformToSchema('indexFilterValues', indexFilterValues, json_schemas_1.schemas.indexFilterValuesSchema);
                        return [4 /*yield*/, this._subscriptionManager.getLogsAsync(this.address, eventName, blockRange, indexFilterValues, ExchangeContract.ABI())];
                    case 1:
                        logs = _a.sent();
                        return [2 /*return*/, logs];
                }
            });
        });
    };
    ExchangeContract.contractName = 'Exchange';
    return ExchangeContract;
}(base_contract_1.BaseContract));
exports.ExchangeContract = ExchangeContract;
// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
//# sourceMappingURL=exchange.js.map