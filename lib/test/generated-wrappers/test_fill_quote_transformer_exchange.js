"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma enum-naming
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
const base_contract_1 = require("@0x/base-contract");
const json_schemas_1 = require("@0x/json-schemas");
const utils_1 = require("@0x/utils");
const web3_wrapper_1 = require("@0x/web3-wrapper");
const assert_1 = require("@0x/assert");
const ethers = require("ethers");
// tslint:enable:no-unused-variable
/* istanbul ignore next */
// tslint:disable:array-type
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
class TestFillQuoteTransformerExchangeContract extends base_contract_1.BaseContract {
    constructor(address, supportedProvider, txDefaults, logDecodeDependencies, deployedBytecode = TestFillQuoteTransformerExchangeContract.deployedBytecode) {
        super('TestFillQuoteTransformerExchange', TestFillQuoteTransformerExchangeContract.ABI(), address, supportedProvider, txDefaults, logDecodeDependencies, deployedBytecode);
        this._methodABIIndex = {};
        utils_1.classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        TestFillQuoteTransformerExchangeContract.ABI().forEach((item, index) => {
            if (item.type === 'function') {
                const methodAbi = item;
                this._methodABIIndex[methodAbi.name] = index;
            }
        });
    }
    static deployFrom0xArtifactAsync(artifact, supportedProvider, txDefaults, logDecodeDependencies) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.assert.doesConformToSchema('txDefaults', txDefaults, json_schemas_1.schemas.txDataSchema, [
                json_schemas_1.schemas.addressSchema,
                json_schemas_1.schemas.numberSchema,
                json_schemas_1.schemas.jsNumber,
            ]);
            if (artifact.compilerOutput === undefined) {
                throw new Error('Compiler output not found in the artifact file');
            }
            const provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
            const bytecode = artifact.compilerOutput.evm.bytecode.object;
            const abi = artifact.compilerOutput.abi;
            const logDecodeDependenciesAbiOnly = {};
            if (Object.keys(logDecodeDependencies) !== undefined) {
                for (const key of Object.keys(logDecodeDependencies)) {
                    logDecodeDependenciesAbiOnly[key] = logDecodeDependencies[key].compilerOutput.abi;
                }
            }
            return TestFillQuoteTransformerExchangeContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly);
        });
    }
    static deployWithLibrariesFrom0xArtifactAsync(artifact, libraryArtifacts, supportedProvider, txDefaults, logDecodeDependencies) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.assert.doesConformToSchema('txDefaults', txDefaults, json_schemas_1.schemas.txDataSchema, [
                json_schemas_1.schemas.addressSchema,
                json_schemas_1.schemas.numberSchema,
                json_schemas_1.schemas.jsNumber,
            ]);
            if (artifact.compilerOutput === undefined) {
                throw new Error('Compiler output not found in the artifact file');
            }
            const provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
            const abi = artifact.compilerOutput.abi;
            const logDecodeDependenciesAbiOnly = {};
            if (Object.keys(logDecodeDependencies) !== undefined) {
                for (const key of Object.keys(logDecodeDependencies)) {
                    logDecodeDependenciesAbiOnly[key] = logDecodeDependencies[key].compilerOutput.abi;
                }
            }
            const libraryAddresses = yield TestFillQuoteTransformerExchangeContract._deployLibrariesAsync(artifact, libraryArtifacts, new web3_wrapper_1.Web3Wrapper(provider), txDefaults);
            const bytecode = base_contract_1.linkLibrariesInBytecode(artifact, libraryAddresses);
            return TestFillQuoteTransformerExchangeContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly);
        });
    }
    static deployAsync(bytecode, abi, supportedProvider, txDefaults, logDecodeDependencies) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.assert.isHexString('bytecode', bytecode);
            assert_1.assert.doesConformToSchema('txDefaults', txDefaults, json_schemas_1.schemas.txDataSchema, [
                json_schemas_1.schemas.addressSchema,
                json_schemas_1.schemas.numberSchema,
                json_schemas_1.schemas.jsNumber,
            ]);
            const provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
            const constructorAbi = base_contract_1.BaseContract._lookupConstructorAbi(abi);
            [] = base_contract_1.BaseContract._formatABIDataItemList(constructorAbi.inputs, [], base_contract_1.BaseContract._bigNumberToString);
            const iface = new ethers.utils.Interface(abi);
            const deployInfo = iface.deployFunction;
            const txData = deployInfo.encode(bytecode, []);
            const web3Wrapper = new web3_wrapper_1.Web3Wrapper(provider);
            const txDataWithDefaults = yield base_contract_1.BaseContract._applyDefaultsToContractTxDataAsync(Object.assign({ data: txData }, txDefaults), web3Wrapper.estimateGasAsync.bind(web3Wrapper));
            const txHash = yield web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            utils_1.logUtils.log(`transactionHash: ${txHash}`);
            const txReceipt = yield web3Wrapper.awaitTransactionSuccessAsync(txHash);
            utils_1.logUtils.log(`TestFillQuoteTransformerExchange successfully deployed at ${txReceipt.contractAddress}`);
            const contractInstance = new TestFillQuoteTransformerExchangeContract(txReceipt.contractAddress, provider, txDefaults, logDecodeDependencies);
            contractInstance.constructorArgs = [];
            return contractInstance;
        });
    }
    /**
     * @returns      The contract ABI
     */
    static ABI() {
        const abi = [
            {
                inputs: [
                    {
                        name: 'behavior',
                        type: 'tuple',
                        components: [
                            {
                                name: 'filledTakerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetMintRatio',
                                type: 'uint256',
                            },
                        ]
                    },
                ],
                name: 'encodeBehaviorData',
                outputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                stateMutability: 'pure',
                type: 'function',
            },
            {
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
                        ]
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
                        ]
                    },
                ],
                stateMutability: 'payable',
                type: 'function',
            },
            {
                inputs: [
                    {
                        name: 'index_0',
                        type: 'bytes4',
                    },
                ],
                name: 'getAssetProxy',
                outputs: [
                    {
                        name: '',
                        type: 'address',
                    },
                ],
                stateMutability: 'view',
                type: 'function',
            },
            {
                inputs: [],
                name: 'protocolFeeMultiplier',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                stateMutability: 'pure',
                type: 'function',
            },
        ];
        return abi;
    }
    static _deployLibrariesAsync(artifact, libraryArtifacts, web3Wrapper, txDefaults, libraryAddresses = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const links = artifact.compilerOutput.evm.bytecode.linkReferences;
            // Go through all linked libraries, recursively deploying them if necessary.
            for (const link of Object.values(links)) {
                for (const libraryName of Object.keys(link)) {
                    if (!libraryAddresses[libraryName]) {
                        // Library not yet deployed.
                        const libraryArtifact = libraryArtifacts[libraryName];
                        if (!libraryArtifact) {
                            throw new Error(`Missing artifact for linked library "${libraryName}"`);
                        }
                        // Deploy any dependent libraries used by this library.
                        yield TestFillQuoteTransformerExchangeContract._deployLibrariesAsync(libraryArtifact, libraryArtifacts, web3Wrapper, txDefaults, libraryAddresses);
                        // Deploy this library.
                        const linkedLibraryBytecode = base_contract_1.linkLibrariesInBytecode(libraryArtifact, libraryAddresses);
                        const txDataWithDefaults = yield base_contract_1.BaseContract._applyDefaultsToContractTxDataAsync(Object.assign({ data: linkedLibraryBytecode }, txDefaults), web3Wrapper.estimateGasAsync.bind(web3Wrapper));
                        const txHash = yield web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                        utils_1.logUtils.log(`transactionHash: ${txHash}`);
                        const { contractAddress } = yield web3Wrapper.awaitTransactionSuccessAsync(txHash);
                        utils_1.logUtils.log(`${libraryArtifact.contractName} successfully deployed at ${contractAddress}`);
                        libraryAddresses[libraryArtifact.contractName] = contractAddress;
                    }
                }
            }
            return libraryAddresses;
        });
    }
    getFunctionSignature(methodName) {
        const index = this._methodABIIndex[methodName];
        const methodAbi = TestFillQuoteTransformerExchangeContract.ABI()[index]; // tslint:disable-line:no-unnecessary-type-assertion
        const functionSignature = base_contract_1.methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    }
    getABIDecodedTransactionData(methodName, callData) {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = this;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecode(callData);
        return abiDecodedCallData;
    }
    getABIDecodedReturnData(methodName, callData) {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = this;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecodeReturnValue(callData);
        return abiDecodedCallData;
    }
    getSelector(methodName) {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = this;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    }
    encodeBehaviorData(behavior) {
        const self = this;
        const functionSignature = 'encodeBehaviorData((uint256,uint256))';
        return {
            sendTransactionAsync(txData, opts = { shouldValidate: true }) {
                return __awaiter(this, void 0, void 0, function* () {
                    const txDataWithDefaults = yield self._applyDefaultsToTxDataAsync(Object.assign({ data: this.getABIEncodedTransactionData() }, txData), this.estimateGasAsync.bind(this));
                    if (opts.shouldValidate !== false) {
                        yield this.callAsync(txDataWithDefaults);
                    }
                    return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                });
            },
            awaitTransactionSuccessAsync(txData, opts = { shouldValidate: true }) {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            estimateGasAsync(txData) {
                return __awaiter(this, void 0, void 0, function* () {
                    const txDataWithDefaults = yield self._applyDefaultsToTxDataAsync(Object.assign({ data: this.getABIEncodedTransactionData() }, txData));
                    return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
                });
            },
            callAsync(callData = {}, defaultBlock) {
                return __awaiter(this, void 0, void 0, function* () {
                    base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                    let rawCallResult;
                    if (self._deployedBytecodeIfExists) {
                        rawCallResult = yield self._evmExecAsync(this.getABIEncodedTransactionData());
                    }
                    else {
                        rawCallResult = yield self._performCallAsync(Object.assign({ data: this.getABIEncodedTransactionData() }, callData), defaultBlock);
                    }
                    const abiEncoder = self._lookupAbiEncoder(functionSignature);
                    base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                    return abiEncoder.strictDecodeReturnValue(rawCallResult);
                });
            },
            getABIEncodedTransactionData() {
                return self._strictEncodeArguments(functionSignature, [behavior
                ]);
            },
        };
    }
    ;
    fillOrder(order, takerAssetFillAmount, signature) {
        const self = this;
        assert_1.assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        assert_1.assert.isString('signature', signature);
        const functionSignature = 'fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),uint256,bytes)';
        return {
            sendTransactionAsync(txData, opts = { shouldValidate: true }) {
                return __awaiter(this, void 0, void 0, function* () {
                    const txDataWithDefaults = yield self._applyDefaultsToTxDataAsync(Object.assign({ data: this.getABIEncodedTransactionData() }, txData), this.estimateGasAsync.bind(this));
                    if (opts.shouldValidate !== false) {
                        yield this.callAsync(txDataWithDefaults);
                    }
                    return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                });
            },
            awaitTransactionSuccessAsync(txData, opts = { shouldValidate: true }) {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            estimateGasAsync(txData) {
                return __awaiter(this, void 0, void 0, function* () {
                    const txDataWithDefaults = yield self._applyDefaultsToTxDataAsync(Object.assign({ data: this.getABIEncodedTransactionData() }, txData));
                    return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
                });
            },
            callAsync(callData = {}, defaultBlock) {
                return __awaiter(this, void 0, void 0, function* () {
                    base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                    const rawCallResult = yield self._performCallAsync(Object.assign({ data: this.getABIEncodedTransactionData() }, callData), defaultBlock);
                    const abiEncoder = self._lookupAbiEncoder(functionSignature);
                    base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                    return abiEncoder.strictDecodeReturnValue(rawCallResult);
                });
            },
            getABIEncodedTransactionData() {
                return self._strictEncodeArguments(functionSignature, [order,
                    takerAssetFillAmount,
                    signature
                ]);
            },
        };
    }
    ;
    getAssetProxy(index_0) {
        const self = this;
        assert_1.assert.isString('index_0', index_0);
        const functionSignature = 'getAssetProxy(bytes4)';
        return {
            sendTransactionAsync(txData, opts = { shouldValidate: true }) {
                return __awaiter(this, void 0, void 0, function* () {
                    const txDataWithDefaults = yield self._applyDefaultsToTxDataAsync(Object.assign({ data: this.getABIEncodedTransactionData() }, txData), this.estimateGasAsync.bind(this));
                    if (opts.shouldValidate !== false) {
                        yield this.callAsync(txDataWithDefaults);
                    }
                    return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                });
            },
            awaitTransactionSuccessAsync(txData, opts = { shouldValidate: true }) {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            estimateGasAsync(txData) {
                return __awaiter(this, void 0, void 0, function* () {
                    const txDataWithDefaults = yield self._applyDefaultsToTxDataAsync(Object.assign({ data: this.getABIEncodedTransactionData() }, txData));
                    return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
                });
            },
            callAsync(callData = {}, defaultBlock) {
                return __awaiter(this, void 0, void 0, function* () {
                    base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                    const rawCallResult = yield self._performCallAsync(Object.assign({ data: this.getABIEncodedTransactionData() }, callData), defaultBlock);
                    const abiEncoder = self._lookupAbiEncoder(functionSignature);
                    base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                    return abiEncoder.strictDecodeReturnValue(rawCallResult);
                });
            },
            getABIEncodedTransactionData() {
                return self._strictEncodeArguments(functionSignature, [index_0
                ]);
            },
        };
    }
    ;
    protocolFeeMultiplier() {
        const self = this;
        const functionSignature = 'protocolFeeMultiplier()';
        return {
            sendTransactionAsync(txData, opts = { shouldValidate: true }) {
                return __awaiter(this, void 0, void 0, function* () {
                    const txDataWithDefaults = yield self._applyDefaultsToTxDataAsync(Object.assign({ data: this.getABIEncodedTransactionData() }, txData), this.estimateGasAsync.bind(this));
                    if (opts.shouldValidate !== false) {
                        yield this.callAsync(txDataWithDefaults);
                    }
                    return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                });
            },
            awaitTransactionSuccessAsync(txData, opts = { shouldValidate: true }) {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            estimateGasAsync(txData) {
                return __awaiter(this, void 0, void 0, function* () {
                    const txDataWithDefaults = yield self._applyDefaultsToTxDataAsync(Object.assign({ data: this.getABIEncodedTransactionData() }, txData));
                    return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
                });
            },
            callAsync(callData = {}, defaultBlock) {
                return __awaiter(this, void 0, void 0, function* () {
                    base_contract_1.BaseContract._assertCallParams(callData, defaultBlock);
                    let rawCallResult;
                    if (self._deployedBytecodeIfExists) {
                        rawCallResult = yield self._evmExecAsync(this.getABIEncodedTransactionData());
                    }
                    else {
                        rawCallResult = yield self._performCallAsync(Object.assign({ data: this.getABIEncodedTransactionData() }, callData), defaultBlock);
                    }
                    const abiEncoder = self._lookupAbiEncoder(functionSignature);
                    base_contract_1.BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                    return abiEncoder.strictDecodeReturnValue(rawCallResult);
                });
            },
            getABIEncodedTransactionData() {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    ;
}
/**
 * @ignore
 */
TestFillQuoteTransformerExchangeContract.deployedBytecode = '0x60806040526004361061003f5760003560e01c80631ce4c78b1461004457806348d8ce2e1461006f578063607041081461009c5780639b44d556146100c9575b600080fd5b34801561005057600080fd5b506100596100e9565b6040516100669190610d26565b60405180910390f35b34801561007b57600080fd5b5061008f61008a36600461090a565b6100ef565b6040516100669190610ac0565b3480156100a857600080fd5b506100bc6100b73660046108ca565b610118565b6040516100669190610a21565b6100dc6100d736600461096b565b61011d565b6040516100669190610cec565b61053990565b6060816040516020016101029190610cd5565b6040516020818303038152906040529050919050565b503090565b61012561082d565b81610165576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161015c90610bbe565b60405180910390fd5b61016d61085c565b61017983850185610921565b90506105393a023481146101b9576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161015c90610b61565b60405133903483900380156108fc02916000818181858888f193505050501580156101e8573d6000803e3d6000fd5b5060006102366101fc6101608a018a610d2f565b8080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061064d92505050565b835190915061025a906102549060a08b01359063ffffffff61066016565b88610684565b9650868173ffffffffffffffffffffffffffffffffffffffff16632724ed4b33306040518363ffffffff1660e01b8152600401610298929190610a42565b60206040518083038186803b1580156102b057600080fd5b505afa1580156102c4573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102e89190610a09565b1015610320576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161015c90610c78565b73ffffffffffffffffffffffffffffffffffffffff81166323b872dd3361034a60208c018c610876565b8a6040518463ffffffff1660e01b815260040161036993929190610a69565b602060405180830381600087803b15801561038357600080fd5b505af1158015610397573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103bb91906108aa565b5060006103d1888a60a001358b6080013561069c565b905060006103e66101fc6101408c018c610d2f565b90508073ffffffffffffffffffffffffffffffffffffffff166340c10f193361041c8860200151670de0b6b3a76400008761069c565b6040518363ffffffff1660e01b8152600401610439929190610a9a565b600060405180830381600087803b15801561045357600080fd5b505af1158015610467573d6000803e3d6000fd5b5050505060006104818b806101a001906101fc9190610d2f565b905060006104988b8d60a001358e60e0013561069c565b9050808273ffffffffffffffffffffffffffffffffffffffff16632724ed4b33306040518363ffffffff1660e01b81526004016104d6929190610a42565b60206040518083038186803b1580156104ee57600080fd5b505afa158015610502573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105269190610a09565b101561055e576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161015c90610c1b565b8173ffffffffffffffffffffffffffffffffffffffff166323b872dd338e604001602081019061058e9190610876565b846040518463ffffffff1660e01b81526004016105ad93929190610a69565b602060405180830381600087803b1580156105c757600080fd5b505af11580156105db573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105ff91906108aa565b5092875250506020850197909752507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff60408401526060830195909552506080810193909352509092915050565b600061065a8260106106c6565b92915050565b60008282111561067e5761067e61067960028585610706565b6107ab565b50900390565b60008183106106935781610695565b825b9392505050565b60006106be836106b2868563ffffffff6107b316565b9063ffffffff6107e416565b949350505050565b600081601401835110156106e7576106e7610679600485518560140161080e565b50016014015173ffffffffffffffffffffffffffffffffffffffff1690565b606063e946c1bb60e01b84848460405160240161072593929190610b31565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff000000000000000000000000000000000000000000000000000000009093169290921790915290509392505050565b805160208201fd5b6000826107c25750600061065a565b828202828482816107cf57fe5b04146106955761069561067960018686610706565b6000816107fa576107fa61067960038585610706565b600082848161080557fe5b04949350505050565b6060632800659560e01b84848460405160240161072593929190610b53565b6040518060a0016040528060008152602001600081526020016000815260200160008152602001600081525090565b604051806040016040528060008152602001600081525090565b600060208284031215610887578081fd5b813573ffffffffffffffffffffffffffffffffffffffff81168114610695578182fd5b6000602082840312156108bb578081fd5b81518015158114610695578182fd5b6000602082840312156108db578081fd5b81357fffffffff0000000000000000000000000000000000000000000000000000000081168114610695578182fd5b60006040828403121561091b578081fd5b50919050565b600060408284031215610932578081fd5b6040516040810181811067ffffffffffffffff82111715610951578283fd5b604052823581526020928301359281019290925250919050565b60008060008060608587031215610980578283fd5b843567ffffffffffffffff80821115610997578485fd5b8187016101c0818a0312156109aa578586fd5b95506020870135945060408701359150808211156109c6578384fd5b81870188601f8201126109d7578485fd5b80359250818311156109e7578485fd5b8860208483010111156109f8578485fd5b959894975050602090940194505050565b600060208284031215610a1a578081fd5b5051919050565b73ffffffffffffffffffffffffffffffffffffffff91909116815260200190565b73ffffffffffffffffffffffffffffffffffffffff92831681529116602082015260400190565b73ffffffffffffffffffffffffffffffffffffffff9384168152919092166020820152604081019190915260600190565b73ffffffffffffffffffffffffffffffffffffffff929092168252602082015260400190565b6000602080835283518082850152825b81811015610aec57858101830151858201604001528201610ad0565b81811115610afd5783604083870101525b50601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016929092016040019392505050565b6060810160048510610b3f57fe5b938152602081019290925260409091015290565b6060810160088510610b3f57fe5b6020808252603a908201527f5465737446696c6c51756f74655472616e73666f726d657245786368616e676560408201527f2f494e53554646494349454e545f50524f544f434f4c5f464545000000000000606082015260800190565b60208082526032908201527f5465737446696c6c51756f74655472616e73666f726d657245786368616e676560408201527f2f494e56414c49445f5349474e41545552450000000000000000000000000000606082015260800190565b6020808252603d908201527f5465737446696c6c51756f74655472616e73666f726d657245786368616e676560408201527f2f494e53554646494349454e545f54414b45525f4645455f46554e4453000000606082015260800190565b60208082526039908201527f5465737446696c6c51756f74655472616e73666f726d657245786368616e676560408201527f2f494e53554646494349454e545f54414b45525f46554e445300000000000000606082015260800190565b813581526020918201359181019190915260400190565b600060a082019050825182526020830151602083015260408301516040830152606083015160608301526080830151608083015292915050565b90815260200190565b60008083357fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe1843603018112610d63578283fd5b8084018035925067ffffffffffffffff831115610d7e578384fd5b60200192505036819003821315610d9457600080fd5b925092905056fea264697066735822122028416588437470c09d95d30e61dfe4278db30a328592fcb28aa981565673851464736f6c634300060b0033';
TestFillQuoteTransformerExchangeContract.contractName = 'TestFillQuoteTransformerExchange';
exports.TestFillQuoteTransformerExchangeContract = TestFillQuoteTransformerExchangeContract;
// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
//# sourceMappingURL=test_fill_quote_transformer_exchange.js.map