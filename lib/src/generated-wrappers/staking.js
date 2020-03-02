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
var StakingEvents;
(function (StakingEvents) {
    StakingEvents["AuthorizedAddressAdded"] = "AuthorizedAddressAdded";
    StakingEvents["AuthorizedAddressRemoved"] = "AuthorizedAddressRemoved";
    StakingEvents["EpochEnded"] = "EpochEnded";
    StakingEvents["EpochFinalized"] = "EpochFinalized";
    StakingEvents["ExchangeAdded"] = "ExchangeAdded";
    StakingEvents["ExchangeRemoved"] = "ExchangeRemoved";
    StakingEvents["MakerStakingPoolSet"] = "MakerStakingPoolSet";
    StakingEvents["MoveStake"] = "MoveStake";
    StakingEvents["OperatorShareDecreased"] = "OperatorShareDecreased";
    StakingEvents["OwnershipTransferred"] = "OwnershipTransferred";
    StakingEvents["ParamsSet"] = "ParamsSet";
    StakingEvents["RewardsPaid"] = "RewardsPaid";
    StakingEvents["Stake"] = "Stake";
    StakingEvents["StakingPoolCreated"] = "StakingPoolCreated";
    StakingEvents["StakingPoolEarnedRewardsInEpoch"] = "StakingPoolEarnedRewardsInEpoch";
    StakingEvents["Unstake"] = "Unstake";
})(StakingEvents = exports.StakingEvents || (exports.StakingEvents = {}));
/* istanbul ignore next */
// tslint:disable:array-type
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
var StakingContract = /** @class */ (function (_super) {
    __extends(StakingContract, _super);
    function StakingContract(address, supportedProvider, txDefaults, logDecodeDependencies, deployedBytecode) {
        if (deployedBytecode === void 0) { deployedBytecode = StakingContract.deployedBytecode; }
        var _this = _super.call(this, 'Staking', StakingContract.ABI(), address, supportedProvider, txDefaults, logDecodeDependencies, deployedBytecode) || this;
        _this._methodABIIndex = {};
        utils_1.classUtils.bindAll(_this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        _this._subscriptionManager = new base_contract_1.SubscriptionManager(StakingContract.ABI(), _this._web3Wrapper);
        StakingContract.ABI().forEach(function (item, index) {
            if (item.type === 'function') {
                var methodAbi = item;
                _this._methodABIIndex[methodAbi.name] = index;
            }
        });
        return _this;
    }
    StakingContract.deployFrom0xArtifactAsync = function (artifact, supportedProvider, txDefaults, logDecodeDependencies) {
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
                return [2 /*return*/, StakingContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly)];
            });
        });
    };
    StakingContract.deployWithLibrariesFrom0xArtifactAsync = function (artifact, libraryArtifacts, supportedProvider, txDefaults, logDecodeDependencies) {
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
                        return [4 /*yield*/, StakingContract._deployLibrariesAsync(artifact, libraryArtifacts, new web3_wrapper_1.Web3Wrapper(provider), txDefaults)];
                    case 1:
                        libraryAddresses = _d.sent();
                        bytecode = base_contract_1.linkLibrariesInBytecode(artifact, libraryAddresses);
                        return [2 /*return*/, StakingContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly)];
                }
            });
        });
    };
    StakingContract.deployAsync = function (bytecode, abi, supportedProvider, txDefaults, logDecodeDependencies) {
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
                        utils_1.logUtils.log("Staking successfully deployed at " + txReceipt.contractAddress);
                        contractInstance = new StakingContract(txReceipt.contractAddress, provider, txDefaults, logDecodeDependencies);
                        contractInstance.constructorArgs = [];
                        return [2 /*return*/, contractInstance];
                }
            });
        });
    };
    /**
     * @returns      The contract ABI
     */
    StakingContract.ABI = function () {
        var abi = [
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'caller',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'AuthorizedAddressAdded',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'caller',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'AuthorizedAddressRemoved',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'epoch',
                        type: 'uint256',
                        indexed: true,
                    },
                    {
                        name: 'numPoolsToFinalize',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'rewardsAvailable',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'totalFeesCollected',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'totalWeightedStake',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'EpochEnded',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'epoch',
                        type: 'uint256',
                        indexed: true,
                    },
                    {
                        name: 'rewardsPaid',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'rewardsRemaining',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'EpochFinalized',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'exchangeAddress',
                        type: 'address',
                        indexed: false,
                    },
                ],
                name: 'ExchangeAdded',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'exchangeAddress',
                        type: 'address',
                        indexed: false,
                    },
                ],
                name: 'ExchangeRemoved',
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
                        name: 'poolId',
                        type: 'bytes32',
                        indexed: true,
                    },
                ],
                name: 'MakerStakingPoolSet',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'staker',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'amount',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'fromStatus',
                        type: 'uint8',
                        indexed: false,
                    },
                    {
                        name: 'fromPool',
                        type: 'bytes32',
                        indexed: true,
                    },
                    {
                        name: 'toStatus',
                        type: 'uint8',
                        indexed: false,
                    },
                    {
                        name: 'toPool',
                        type: 'bytes32',
                        indexed: true,
                    },
                ],
                name: 'MoveStake',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'poolId',
                        type: 'bytes32',
                        indexed: true,
                    },
                    {
                        name: 'oldOperatorShare',
                        type: 'uint32',
                        indexed: false,
                    },
                    {
                        name: 'newOperatorShare',
                        type: 'uint32',
                        indexed: false,
                    },
                ],
                name: 'OperatorShareDecreased',
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
                        name: 'epochDurationInSeconds',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'rewardDelegatedStakeWeight',
                        type: 'uint32',
                        indexed: false,
                    },
                    {
                        name: 'minimumPoolStake',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'cobbDouglasAlphaNumerator',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'cobbDouglasAlphaDenominator',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'ParamsSet',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'epoch',
                        type: 'uint256',
                        indexed: true,
                    },
                    {
                        name: 'poolId',
                        type: 'bytes32',
                        indexed: true,
                    },
                    {
                        name: 'operatorReward',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'membersReward',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'RewardsPaid',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'staker',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'amount',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'Stake',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'poolId',
                        type: 'bytes32',
                        indexed: false,
                    },
                    {
                        name: 'operator',
                        type: 'address',
                        indexed: false,
                    },
                    {
                        name: 'operatorShare',
                        type: 'uint32',
                        indexed: false,
                    },
                ],
                name: 'StakingPoolCreated',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'epoch',
                        type: 'uint256',
                        indexed: true,
                    },
                    {
                        name: 'poolId',
                        type: 'bytes32',
                        indexed: true,
                    },
                ],
                name: 'StakingPoolEarnedRewardsInEpoch',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'staker',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'amount',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'Unstake',
                outputs: [],
                type: 'event',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                    },
                ],
                name: 'addAuthorizedAddress',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'addr',
                        type: 'address',
                    },
                ],
                name: 'addExchangeAddress',
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
                        type: 'uint256',
                    },
                ],
                name: 'aggregatedStatsByEpoch',
                outputs: [
                    {
                        name: 'rewardsAvailable',
                        type: 'uint256',
                    },
                    {
                        name: 'numPoolsToFinalize',
                        type: 'uint256',
                    },
                    {
                        name: 'totalFeesCollected',
                        type: 'uint256',
                    },
                    {
                        name: 'totalWeightedStake',
                        type: 'uint256',
                    },
                    {
                        name: 'totalRewardsFinalized',
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
                        name: 'index_0',
                        type: 'uint256',
                    },
                ],
                name: 'authorities',
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
                inputs: [
                    {
                        name: 'index_0',
                        type: 'address',
                    },
                ],
                name: 'authorized',
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
                name: 'cobbDouglasAlphaDenominator',
                outputs: [
                    {
                        name: '',
                        type: 'uint32',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'cobbDouglasAlphaNumerator',
                outputs: [
                    {
                        name: '',
                        type: 'uint32',
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
                        name: 'poolId',
                        type: 'bytes32',
                    },
                    {
                        name: 'member',
                        type: 'address',
                    },
                ],
                name: 'computeRewardBalanceOfDelegator',
                outputs: [
                    {
                        name: 'reward',
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
                        name: 'poolId',
                        type: 'bytes32',
                    },
                ],
                name: 'computeRewardBalanceOfOperator',
                outputs: [
                    {
                        name: 'reward',
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
                        name: 'operatorShare',
                        type: 'uint32',
                    },
                    {
                        name: 'addOperatorAsMaker',
                        type: 'bool',
                    },
                ],
                name: 'createStakingPool',
                outputs: [
                    {
                        name: 'poolId',
                        type: 'bytes32',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'currentEpoch',
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
                name: 'currentEpochStartTimeInSeconds',
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
                        name: 'poolId',
                        type: 'bytes32',
                    },
                    {
                        name: 'newOperatorShare',
                        type: 'uint32',
                    },
                ],
                name: 'decreaseStakingPoolOperatorShare',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [],
                name: 'endEpoch',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'epochDurationInSeconds',
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
                        name: 'poolId',
                        type: 'bytes32',
                    },
                ],
                name: 'finalizePool',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'getAuthorizedAddresses',
                outputs: [
                    {
                        name: '',
                        type: 'address[]',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'getCurrentEpochEarliestEndTimeInSeconds',
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
                        name: 'stakeStatus',
                        type: 'uint8',
                    },
                ],
                name: 'getGlobalStakeByStatus',
                outputs: [
                    {
                        name: 'balance',
                        type: 'tuple',
                        components: [
                            {
                                name: 'currentEpoch',
                                type: 'uint64',
                            },
                            {
                                name: 'currentEpochBalance',
                                type: 'uint96',
                            },
                            {
                                name: 'nextEpochBalance',
                                type: 'uint96',
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
                        name: 'staker',
                        type: 'address',
                    },
                    {
                        name: 'stakeStatus',
                        type: 'uint8',
                    },
                ],
                name: 'getOwnerStakeByStatus',
                outputs: [
                    {
                        name: 'balance',
                        type: 'tuple',
                        components: [
                            {
                                name: 'currentEpoch',
                                type: 'uint64',
                            },
                            {
                                name: 'currentEpochBalance',
                                type: 'uint96',
                            },
                            {
                                name: 'nextEpochBalance',
                                type: 'uint96',
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
                inputs: [],
                name: 'getParams',
                outputs: [
                    {
                        name: '_epochDurationInSeconds',
                        type: 'uint256',
                    },
                    {
                        name: '_rewardDelegatedStakeWeight',
                        type: 'uint32',
                    },
                    {
                        name: '_minimumPoolStake',
                        type: 'uint256',
                    },
                    {
                        name: '_cobbDouglasAlphaNumerator',
                        type: 'uint32',
                    },
                    {
                        name: '_cobbDouglasAlphaDenominator',
                        type: 'uint32',
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
                        name: 'staker',
                        type: 'address',
                    },
                    {
                        name: 'poolId',
                        type: 'bytes32',
                    },
                ],
                name: 'getStakeDelegatedToPoolByOwner',
                outputs: [
                    {
                        name: 'balance',
                        type: 'tuple',
                        components: [
                            {
                                name: 'currentEpoch',
                                type: 'uint64',
                            },
                            {
                                name: 'currentEpochBalance',
                                type: 'uint96',
                            },
                            {
                                name: 'nextEpochBalance',
                                type: 'uint96',
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
                        name: 'poolId',
                        type: 'bytes32',
                    },
                ],
                name: 'getStakingPool',
                outputs: [
                    {
                        name: '',
                        type: 'tuple',
                        components: [
                            {
                                name: 'operator',
                                type: 'address',
                            },
                            {
                                name: 'operatorShare',
                                type: 'uint32',
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
                        name: 'poolId',
                        type: 'bytes32',
                    },
                ],
                name: 'getStakingPoolStatsThisEpoch',
                outputs: [
                    {
                        name: '',
                        type: 'tuple',
                        components: [
                            {
                                name: 'feesCollected',
                                type: 'uint256',
                            },
                            {
                                name: 'weightedStake',
                                type: 'uint256',
                            },
                            {
                                name: 'membersStake',
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
                        name: 'staker',
                        type: 'address',
                    },
                ],
                name: 'getTotalStake',
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
                        name: 'poolId',
                        type: 'bytes32',
                    },
                ],
                name: 'getTotalStakeDelegatedToPool',
                outputs: [
                    {
                        name: 'balance',
                        type: 'tuple',
                        components: [
                            {
                                name: 'currentEpoch',
                                type: 'uint64',
                            },
                            {
                                name: 'currentEpochBalance',
                                type: 'uint96',
                            },
                            {
                                name: 'nextEpochBalance',
                                type: 'uint96',
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
                inputs: [],
                name: 'getWethContract',
                outputs: [
                    {
                        name: 'wethContract',
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
                name: 'getZrxVault',
                outputs: [
                    {
                        name: 'zrxVault',
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
                name: 'init',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'poolId',
                        type: 'bytes32',
                    },
                ],
                name: 'joinStakingPoolAsMaker',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'lastPoolId',
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
                inputs: [],
                name: 'minimumPoolStake',
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
                        name: 'from',
                        type: 'tuple',
                        components: [
                            {
                                name: 'status',
                                type: 'uint8',
                            },
                            {
                                name: 'poolId',
                                type: 'bytes32',
                            },
                        ],
                    },
                    {
                        name: 'to',
                        type: 'tuple',
                        components: [
                            {
                                name: 'status',
                                type: 'uint8',
                            },
                            {
                                name: 'poolId',
                                type: 'bytes32',
                            },
                        ],
                    },
                    {
                        name: 'amount',
                        type: 'uint256',
                    },
                ],
                name: 'moveStake',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
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
                        name: 'makerAddress',
                        type: 'address',
                    },
                    {
                        name: 'payerAddress',
                        type: 'address',
                    },
                    {
                        name: 'protocolFee',
                        type: 'uint256',
                    },
                ],
                name: 'payProtocolFee',
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
                        type: 'address',
                    },
                ],
                name: 'poolIdByMaker',
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
                        type: 'bytes32',
                    },
                    {
                        name: 'index_1',
                        type: 'uint256',
                    },
                ],
                name: 'poolStatsByEpoch',
                outputs: [
                    {
                        name: 'feesCollected',
                        type: 'uint256',
                    },
                    {
                        name: 'weightedStake',
                        type: 'uint256',
                    },
                    {
                        name: 'membersStake',
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
                        name: 'target',
                        type: 'address',
                    },
                ],
                name: 'removeAuthorizedAddress',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                    },
                    {
                        name: 'index',
                        type: 'uint256',
                    },
                ],
                name: 'removeAuthorizedAddressAtIndex',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'addr',
                        type: 'address',
                    },
                ],
                name: 'removeExchangeAddress',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'rewardDelegatedStakeWeight',
                outputs: [
                    {
                        name: '',
                        type: 'uint32',
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
                        type: 'bytes32',
                    },
                ],
                name: 'rewardsByPoolId',
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
                        name: '_epochDurationInSeconds',
                        type: 'uint256',
                    },
                    {
                        name: '_rewardDelegatedStakeWeight',
                        type: 'uint32',
                    },
                    {
                        name: '_minimumPoolStake',
                        type: 'uint256',
                    },
                    {
                        name: '_cobbDouglasAlphaNumerator',
                        type: 'uint32',
                    },
                    {
                        name: '_cobbDouglasAlphaDenominator',
                        type: 'uint32',
                    },
                ],
                name: 'setParams',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'amount',
                        type: 'uint256',
                    },
                ],
                name: 'stake',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'stakingContract',
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
            {
                constant: false,
                inputs: [
                    {
                        name: 'amount',
                        type: 'uint256',
                    },
                ],
                name: 'unstake',
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
                        type: 'address',
                    },
                ],
                name: 'validExchanges',
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
                name: 'wethReservedForPoolRewards',
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
                        name: 'poolId',
                        type: 'bytes32',
                    },
                ],
                name: 'withdrawDelegatorRewards',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
        ];
        return abi;
    };
    StakingContract._deployLibrariesAsync = function (artifact, libraryArtifacts, web3Wrapper, txDefaults, libraryAddresses) {
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
                        return [4 /*yield*/, StakingContract._deployLibrariesAsync(libraryArtifact, libraryArtifacts, web3Wrapper, txDefaults, libraryAddresses)];
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
    StakingContract.prototype.getFunctionSignature = function (methodName) {
        var index = this._methodABIIndex[methodName];
        var methodAbi = StakingContract.ABI()[index]; // tslint:disable-line:no-unnecessary-type-assertion
        var functionSignature = base_contract_1.methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    };
    StakingContract.prototype.getABIDecodedTransactionData = function (methodName, callData) {
        var functionSignature = this.getFunctionSignature(methodName);
        var self = this;
        var abiEncoder = self._lookupAbiEncoder(functionSignature);
        var abiDecodedCallData = abiEncoder.strictDecode(callData);
        return abiDecodedCallData;
    };
    StakingContract.prototype.getABIDecodedReturnData = function (methodName, callData) {
        var functionSignature = this.getFunctionSignature(methodName);
        var self = this;
        var abiEncoder = self._lookupAbiEncoder(functionSignature);
        var abiDecodedCallData = abiEncoder.strictDecodeReturnValue(callData);
        return abiDecodedCallData;
    };
    StakingContract.prototype.getSelector = function (methodName) {
        var functionSignature = this.getFunctionSignature(methodName);
        var self = this;
        var abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    };
    /**
     * Authorizes an address.
     * @param target Address to authorize.
     */
    StakingContract.prototype.addAuthorizedAddress = function (target) {
        var self = this;
        assert_1.assert.isString('target', target);
        var functionSignature = 'addAuthorizedAddress(address)';
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
                return self._strictEncodeArguments(functionSignature, [target.toLowerCase()]);
            },
        };
    };
    /**
     * Adds a new exchange address
     * @param addr Address of exchange contract to add
     */
    StakingContract.prototype.addExchangeAddress = function (addr) {
        var self = this;
        assert_1.assert.isString('addr', addr);
        var functionSignature = 'addExchangeAddress(address)';
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
                return self._strictEncodeArguments(functionSignature, [addr.toLowerCase()]);
            },
        };
    };
    StakingContract.prototype.aggregatedStatsByEpoch = function (index_0) {
        var self = this;
        assert_1.assert.isBigNumber('index_0', index_0);
        var functionSignature = 'aggregatedStatsByEpoch(uint256)';
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
    StakingContract.prototype.authorities = function (index_0) {
        var self = this;
        assert_1.assert.isBigNumber('index_0', index_0);
        var functionSignature = 'authorities(uint256)';
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
    StakingContract.prototype.authorized = function (index_0) {
        var self = this;
        assert_1.assert.isString('index_0', index_0);
        var functionSignature = 'authorized(address)';
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
    StakingContract.prototype.cobbDouglasAlphaDenominator = function () {
        var self = this;
        var functionSignature = 'cobbDouglasAlphaDenominator()';
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
    StakingContract.prototype.cobbDouglasAlphaNumerator = function () {
        var self = this;
        var functionSignature = 'cobbDouglasAlphaNumerator()';
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
     * Computes the reward balance in ETH of a specific member of a pool.
     * @param poolId Unique id of pool.
     * @param member The member of the pool.
     * @returns totalReward Balance in ETH.
     */
    StakingContract.prototype.computeRewardBalanceOfDelegator = function (poolId, member) {
        var self = this;
        assert_1.assert.isString('poolId', poolId);
        assert_1.assert.isString('member', member);
        var functionSignature = 'computeRewardBalanceOfDelegator(bytes32,address)';
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
                return self._strictEncodeArguments(functionSignature, [poolId, member.toLowerCase()]);
            },
        };
    };
    /**
     * Computes the reward balance in ETH of the operator of a pool.
     * @param poolId Unique id of pool.
     * @returns totalReward Balance in ETH.
     */
    StakingContract.prototype.computeRewardBalanceOfOperator = function (poolId) {
        var self = this;
        assert_1.assert.isString('poolId', poolId);
        var functionSignature = 'computeRewardBalanceOfOperator(bytes32)';
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
                return self._strictEncodeArguments(functionSignature, [poolId]);
            },
        };
    };
    /**
     * Create a new staking pool. The sender will be the operator of this pool. Note that an operator must be payable.
     * @param operatorShare Portion of rewards owned by the operator, in ppm.
     * @param addOperatorAsMaker Adds operator to the created pool as a maker for
     *     convenience iff true.
     * @returns poolId The unique pool id generated for this pool.
     */
    StakingContract.prototype.createStakingPool = function (operatorShare, addOperatorAsMaker) {
        var self = this;
        assert_1.assert.isNumberOrBigNumber('operatorShare', operatorShare);
        assert_1.assert.isBoolean('addOperatorAsMaker', addOperatorAsMaker);
        var functionSignature = 'createStakingPool(uint32,bool)';
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
                return self._strictEncodeArguments(functionSignature, [operatorShare, addOperatorAsMaker]);
            },
        };
    };
    StakingContract.prototype.currentEpoch = function () {
        var self = this;
        var functionSignature = 'currentEpoch()';
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
    StakingContract.prototype.currentEpochStartTimeInSeconds = function () {
        var self = this;
        var functionSignature = 'currentEpochStartTimeInSeconds()';
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
     * Decreases the operator share for the given pool (i.e. increases pool rewards for members).
     * @param poolId Unique Id of pool.
     * @param newOperatorShare The newly decreased percentage of any rewards owned
     *     by the operator.
     */
    StakingContract.prototype.decreaseStakingPoolOperatorShare = function (poolId, newOperatorShare) {
        var self = this;
        assert_1.assert.isString('poolId', poolId);
        assert_1.assert.isNumberOrBigNumber('newOperatorShare', newOperatorShare);
        var functionSignature = 'decreaseStakingPoolOperatorShare(bytes32,uint32)';
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
                return self._strictEncodeArguments(functionSignature, [poolId, newOperatorShare]);
            },
        };
    };
    /**
     * Begins a new epoch, preparing the prior one for finalization.
     * Throws if not enough time has passed between epochs or if the
     * previous epoch was not fully finalized.
     * @returns numPoolsToFinalize The number of unfinalized pools.
     */
    StakingContract.prototype.endEpoch = function () {
        var self = this;
        var functionSignature = 'endEpoch()';
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
    StakingContract.prototype.epochDurationInSeconds = function () {
        var self = this;
        var functionSignature = 'epochDurationInSeconds()';
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
     * Instantly finalizes a single pool that earned rewards in the previous
     * epoch, crediting it rewards for members and withdrawing operator's
     * rewards as WETH. This can be called by internal functions that need
     * to finalize a pool immediately. Does nothing if the pool is already
     * finalized or did not earn rewards in the previous epoch.
     * @param poolId The pool ID to finalize.
     */
    StakingContract.prototype.finalizePool = function (poolId) {
        var self = this;
        assert_1.assert.isString('poolId', poolId);
        var functionSignature = 'finalizePool(bytes32)';
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
                return self._strictEncodeArguments(functionSignature, [poolId]);
            },
        };
    };
    /**
     * Gets all authorized addresses.
     * @returns Array of authorized addresses.
     */
    StakingContract.prototype.getAuthorizedAddresses = function () {
        var self = this;
        var functionSignature = 'getAuthorizedAddresses()';
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
     * Returns the earliest end time in seconds of this epoch.
     * The next epoch can begin once this time is reached.
     * Epoch period = [startTimeInSeconds..endTimeInSeconds)
     * @returns Time in seconds.
     */
    StakingContract.prototype.getCurrentEpochEarliestEndTimeInSeconds = function () {
        var self = this;
        var functionSignature = 'getCurrentEpochEarliestEndTimeInSeconds()';
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
     * Gets global stake for a given status.
     * @param stakeStatus UNDELEGATED or DELEGATED
     * @returns Global stake for given status.
     */
    StakingContract.prototype.getGlobalStakeByStatus = function (stakeStatus) {
        var self = this;
        assert_1.assert.isNumberOrBigNumber('stakeStatus', stakeStatus);
        var functionSignature = 'getGlobalStakeByStatus(uint8)';
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
                return self._strictEncodeArguments(functionSignature, [stakeStatus]);
            },
        };
    };
    /**
     * Gets an owner's stake balances by status.
     * @param staker Owner of stake.
     * @param stakeStatus UNDELEGATED or DELEGATED
     * @returns Owner&#x27;s stake balances for given status.
     */
    StakingContract.prototype.getOwnerStakeByStatus = function (staker, stakeStatus) {
        var self = this;
        assert_1.assert.isString('staker', staker);
        assert_1.assert.isNumberOrBigNumber('stakeStatus', stakeStatus);
        var functionSignature = 'getOwnerStakeByStatus(address,uint8)';
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
                return self._strictEncodeArguments(functionSignature, [staker.toLowerCase(), stakeStatus]);
            },
        };
    };
    /**
     * Retrieves all configurable parameter values.
     * @returns _epochDurationInSeconds Minimum seconds between epochs._rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm._minimumPoolStake Minimum amount of stake required in a pool to collect rewards._cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor._cobbDouglasAlphaDenominator Denominator for cobb douglas alpha factor.
     */
    StakingContract.prototype.getParams = function () {
        var self = this;
        var functionSignature = 'getParams()';
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
     * Returns the stake delegated to a specific staking pool, by a given staker.
     * @param staker of stake.
     * @param poolId Unique Id of pool.
     * @returns Stake delegated to pool by staker.
     */
    StakingContract.prototype.getStakeDelegatedToPoolByOwner = function (staker, poolId) {
        var self = this;
        assert_1.assert.isString('staker', staker);
        assert_1.assert.isString('poolId', poolId);
        var functionSignature = 'getStakeDelegatedToPoolByOwner(address,bytes32)';
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
                return self._strictEncodeArguments(functionSignature, [staker.toLowerCase(), poolId]);
            },
        };
    };
    /**
     * Returns a staking pool
     * @param poolId Unique id of pool.
     */
    StakingContract.prototype.getStakingPool = function (poolId) {
        var self = this;
        assert_1.assert.isString('poolId', poolId);
        var functionSignature = 'getStakingPool(bytes32)';
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
                return self._strictEncodeArguments(functionSignature, [poolId]);
            },
        };
    };
    /**
     * Get stats on a staking pool in this epoch.
     * @param poolId Pool Id to query.
     * @returns PoolStats struct for pool id.
     */
    StakingContract.prototype.getStakingPoolStatsThisEpoch = function (poolId) {
        var self = this;
        assert_1.assert.isString('poolId', poolId);
        var functionSignature = 'getStakingPoolStatsThisEpoch(bytes32)';
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
                return self._strictEncodeArguments(functionSignature, [poolId]);
            },
        };
    };
    /**
     * Returns the total stake for a given staker.
     * @param staker of stake.
     * @returns Total ZRX staked by &#x60;staker&#x60;.
     */
    StakingContract.prototype.getTotalStake = function (staker) {
        var self = this;
        assert_1.assert.isString('staker', staker);
        var functionSignature = 'getTotalStake(address)';
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
                return self._strictEncodeArguments(functionSignature, [staker.toLowerCase()]);
            },
        };
    };
    /**
     * Returns the total stake delegated to a specific staking pool,
     * across all members.
     * @param poolId Unique Id of pool.
     * @returns Total stake delegated to pool.
     */
    StakingContract.prototype.getTotalStakeDelegatedToPool = function (poolId) {
        var self = this;
        assert_1.assert.isString('poolId', poolId);
        var functionSignature = 'getTotalStakeDelegatedToPool(bytes32)';
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
                return self._strictEncodeArguments(functionSignature, [poolId]);
            },
        };
    };
    /**
     * An overridable way to access the deployed WETH contract.
     * Must be view to allow overrides to access state.
     * @returns wethContract The WETH contract instance.
     */
    StakingContract.prototype.getWethContract = function () {
        var self = this;
        var functionSignature = 'getWethContract()';
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
     * An overridable way to access the deployed zrxVault.
     * Must be view to allow overrides to access state.
     * @returns zrxVault The zrxVault contract.
     */
    StakingContract.prototype.getZrxVault = function () {
        var self = this;
        var functionSignature = 'getZrxVault()';
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
     * Initialize storage owned by this contract.
     * This function should not be called directly.
     * The StakingProxy contract will call it in `attachStakingContract()`.
     */
    StakingContract.prototype.init = function () {
        var self = this;
        var functionSignature = 'init()';
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
     * Allows caller to join a staking pool as a maker.
     * @param poolId Unique id of pool.
     */
    StakingContract.prototype.joinStakingPoolAsMaker = function (poolId) {
        var self = this;
        assert_1.assert.isString('poolId', poolId);
        var functionSignature = 'joinStakingPoolAsMaker(bytes32)';
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
                return self._strictEncodeArguments(functionSignature, [poolId]);
            },
        };
    };
    StakingContract.prototype.lastPoolId = function () {
        var self = this;
        var functionSignature = 'lastPoolId()';
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
    StakingContract.prototype.minimumPoolStake = function () {
        var self = this;
        var functionSignature = 'minimumPoolStake()';
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
     * Moves stake between statuses: 'undelegated' or 'delegated'.
     * Delegated stake can also be moved between pools.
     * This change comes into effect next epoch.
     * @param from Status to move stake out of.
     * @param to Status to move stake into.
     * @param amount Amount of stake to move.
     */
    StakingContract.prototype.moveStake = function (from, to, amount) {
        var self = this;
        assert_1.assert.isBigNumber('amount', amount);
        var functionSignature = 'moveStake((uint8,bytes32),(uint8,bytes32),uint256)';
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
                return self._strictEncodeArguments(functionSignature, [from, to, amount]);
            },
        };
    };
    StakingContract.prototype.owner = function () {
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
     * Pays a protocol fee in ETH or WETH.
     * Only a known 0x exchange can call this method. See
     * (MixinExchangeManager).
     * @param makerAddress The address of the order's maker.
     * @param payerAddress The address of the protocol fee payer.
     * @param protocolFee The protocol fee amount. This is either passed as ETH or
     *     transferred as WETH.
     */
    StakingContract.prototype.payProtocolFee = function (makerAddress, payerAddress, protocolFee) {
        var self = this;
        assert_1.assert.isString('makerAddress', makerAddress);
        assert_1.assert.isString('payerAddress', payerAddress);
        assert_1.assert.isBigNumber('protocolFee', protocolFee);
        var functionSignature = 'payProtocolFee(address,address,uint256)';
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
                    makerAddress.toLowerCase(),
                    payerAddress.toLowerCase(),
                    protocolFee,
                ]);
            },
        };
    };
    StakingContract.prototype.poolIdByMaker = function (index_0) {
        var self = this;
        assert_1.assert.isString('index_0', index_0);
        var functionSignature = 'poolIdByMaker(address)';
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
    StakingContract.prototype.poolStatsByEpoch = function (index_0, index_1) {
        var self = this;
        assert_1.assert.isString('index_0', index_0);
        assert_1.assert.isBigNumber('index_1', index_1);
        var functionSignature = 'poolStatsByEpoch(bytes32,uint256)';
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
                return self._strictEncodeArguments(functionSignature, [index_0, index_1]);
            },
        };
    };
    /**
     * Removes authorizion of an address.
     * @param target Address to remove authorization from.
     */
    StakingContract.prototype.removeAuthorizedAddress = function (target) {
        var self = this;
        assert_1.assert.isString('target', target);
        var functionSignature = 'removeAuthorizedAddress(address)';
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
                return self._strictEncodeArguments(functionSignature, [target.toLowerCase()]);
            },
        };
    };
    /**
     * Removes authorizion of an address.
     * @param target Address to remove authorization from.
     * @param index Index of target in authorities array.
     */
    StakingContract.prototype.removeAuthorizedAddressAtIndex = function (target, index) {
        var self = this;
        assert_1.assert.isString('target', target);
        assert_1.assert.isBigNumber('index', index);
        var functionSignature = 'removeAuthorizedAddressAtIndex(address,uint256)';
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
                return self._strictEncodeArguments(functionSignature, [target.toLowerCase(), index]);
            },
        };
    };
    /**
     * Removes an existing exchange address
     * @param addr Address of exchange contract to remove
     */
    StakingContract.prototype.removeExchangeAddress = function (addr) {
        var self = this;
        assert_1.assert.isString('addr', addr);
        var functionSignature = 'removeExchangeAddress(address)';
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
                return self._strictEncodeArguments(functionSignature, [addr.toLowerCase()]);
            },
        };
    };
    StakingContract.prototype.rewardDelegatedStakeWeight = function () {
        var self = this;
        var functionSignature = 'rewardDelegatedStakeWeight()';
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
    StakingContract.prototype.rewardsByPoolId = function (index_0) {
        var self = this;
        assert_1.assert.isString('index_0', index_0);
        var functionSignature = 'rewardsByPoolId(bytes32)';
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
     * Set all configurable parameters at once.
     * @param _epochDurationInSeconds Minimum seconds between epochs.
     * @param _rewardDelegatedStakeWeight How much delegated stake is weighted vs
     *     operator stake, in ppm.
     * @param _minimumPoolStake Minimum amount of stake required in a pool to
     *     collect rewards.
     * @param _cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
     * @param _cobbDouglasAlphaDenominator Denominator for cobb douglas alpha
     *     factor.
     */
    StakingContract.prototype.setParams = function (_epochDurationInSeconds, _rewardDelegatedStakeWeight, _minimumPoolStake, _cobbDouglasAlphaNumerator, _cobbDouglasAlphaDenominator) {
        var self = this;
        assert_1.assert.isBigNumber('_epochDurationInSeconds', _epochDurationInSeconds);
        assert_1.assert.isNumberOrBigNumber('_rewardDelegatedStakeWeight', _rewardDelegatedStakeWeight);
        assert_1.assert.isBigNumber('_minimumPoolStake', _minimumPoolStake);
        assert_1.assert.isNumberOrBigNumber('_cobbDouglasAlphaNumerator', _cobbDouglasAlphaNumerator);
        assert_1.assert.isNumberOrBigNumber('_cobbDouglasAlphaDenominator', _cobbDouglasAlphaDenominator);
        var functionSignature = 'setParams(uint256,uint32,uint256,uint32,uint32)';
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
                    _epochDurationInSeconds,
                    _rewardDelegatedStakeWeight,
                    _minimumPoolStake,
                    _cobbDouglasAlphaNumerator,
                    _cobbDouglasAlphaDenominator,
                ]);
            },
        };
    };
    /**
     * Stake ZRX tokens. Tokens are deposited into the ZRX Vault.
     * Unstake to retrieve the ZRX. Stake is in the 'Active' status.
     * @param amount Amount of ZRX to stake.
     */
    StakingContract.prototype.stake = function (amount) {
        var self = this;
        assert_1.assert.isBigNumber('amount', amount);
        var functionSignature = 'stake(uint256)';
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
                return self._strictEncodeArguments(functionSignature, [amount]);
            },
        };
    };
    StakingContract.prototype.stakingContract = function () {
        var self = this;
        var functionSignature = 'stakingContract()';
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
     * Change the owner of this contract.
     * @param newOwner New owner address.
     */
    StakingContract.prototype.transferOwnership = function (newOwner) {
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
     * Unstake. Tokens are withdrawn from the ZRX Vault and returned to
     * the staker. Stake must be in the 'undelegated' status in both the
     * current and next epoch in order to be unstaked.
     * @param amount Amount of ZRX to unstake.
     */
    StakingContract.prototype.unstake = function (amount) {
        var self = this;
        assert_1.assert.isBigNumber('amount', amount);
        var functionSignature = 'unstake(uint256)';
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
                return self._strictEncodeArguments(functionSignature, [amount]);
            },
        };
    };
    StakingContract.prototype.validExchanges = function (index_0) {
        var self = this;
        assert_1.assert.isString('index_0', index_0);
        var functionSignature = 'validExchanges(address)';
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
    StakingContract.prototype.wethReservedForPoolRewards = function () {
        var self = this;
        var functionSignature = 'wethReservedForPoolRewards()';
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
     * Withdraws the caller's WETH rewards that have accumulated
     * until the last epoch.
     * @param poolId Unique id of pool.
     */
    StakingContract.prototype.withdrawDelegatorRewards = function (poolId) {
        var self = this;
        assert_1.assert.isString('poolId', poolId);
        var functionSignature = 'withdrawDelegatorRewards(bytes32)';
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
                return self._strictEncodeArguments(functionSignature, [poolId]);
            },
        };
    };
    /**
     * Subscribe to an event type emitted by the Staking contract.
     * @param eventName The Staking contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    StakingContract.prototype.subscribe = function (eventName, indexFilterValues, callback, isVerbose, blockPollingIntervalMs) {
        if (isVerbose === void 0) { isVerbose = false; }
        assert_1.assert.doesBelongToStringEnum('eventName', eventName, StakingEvents);
        assert_1.assert.doesConformToSchema('indexFilterValues', indexFilterValues, json_schemas_1.schemas.indexFilterValuesSchema);
        assert_1.assert.isFunction('callback', callback);
        var subscriptionToken = this._subscriptionManager.subscribe(this.address, eventName, indexFilterValues, StakingContract.ABI(), callback, isVerbose, blockPollingIntervalMs);
        return subscriptionToken;
    };
    /**
     * Cancel a subscription
     * @param subscriptionToken Subscription token returned by `subscribe()`
     */
    StakingContract.prototype.unsubscribe = function (subscriptionToken) {
        this._subscriptionManager.unsubscribe(subscriptionToken);
    };
    /**
     * Cancels all existing subscriptions
     */
    StakingContract.prototype.unsubscribeAll = function () {
        this._subscriptionManager.unsubscribeAll();
    };
    /**
     * Gets historical logs without creating a subscription
     * @param eventName The Staking contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    StakingContract.prototype.getLogsAsync = function (eventName, blockRange, indexFilterValues) {
        return __awaiter(this, void 0, void 0, function () {
            var logs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert_1.assert.doesBelongToStringEnum('eventName', eventName, StakingEvents);
                        assert_1.assert.doesConformToSchema('blockRange', blockRange, json_schemas_1.schemas.blockRangeSchema);
                        assert_1.assert.doesConformToSchema('indexFilterValues', indexFilterValues, json_schemas_1.schemas.indexFilterValuesSchema);
                        return [4 /*yield*/, this._subscriptionManager.getLogsAsync(this.address, eventName, blockRange, indexFilterValues, StakingContract.ABI())];
                    case 1:
                        logs = _a.sent();
                        return [2 /*return*/, logs];
                }
            });
        });
    };
    StakingContract.contractName = 'Staking';
    return StakingContract;
}(base_contract_1.BaseContract));
exports.StakingContract = StakingContract;
// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
//# sourceMappingURL=staking.js.map