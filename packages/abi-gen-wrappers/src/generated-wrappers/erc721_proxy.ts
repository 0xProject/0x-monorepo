// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma enum-naming
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import {
    AwaitTransactionSuccessOpts,
    ContractFunctionObj,
    ContractTxFunctionObj,
    SendTransactionOpts,
    BaseContract,
    SubscriptionManager,
    PromiseWithTransactionHash,
    methodAbiToFunctionSignature,
} from '@0x/base-contract';
import { schemas } from '@0x/json-schemas';
import {
    BlockParam,
    BlockParamLiteral,
    BlockRange,
    CallData,
    ContractAbi,
    ContractArtifact,
    DecodedLogArgs,
    LogWithDecodedArgs,
    MethodAbi,
    TransactionReceiptWithDecodedLogs,
    TxData,
    TxDataPayable,
    SupportedProvider,
} from 'ethereum-types';
import { BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

export type ERC721ProxyEventArgs =
    | ERC721ProxyAuthorizedAddressAddedEventArgs
    | ERC721ProxyAuthorizedAddressRemovedEventArgs;

export enum ERC721ProxyEvents {
    AuthorizedAddressAdded = 'AuthorizedAddressAdded',
    AuthorizedAddressRemoved = 'AuthorizedAddressRemoved',
}

export interface ERC721ProxyAuthorizedAddressAddedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}

export interface ERC721ProxyAuthorizedAddressRemovedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ERC721ProxyContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode =
        '0x608060405234801561001057600080fd5b50600436106100a35760003560e01c80639ad2674411610076578063b91816111161005b578063b9181611146103ea578063d39de6e914610431578063f2fde38b14610489576100a3565b80639ad2674414610374578063ae25532e146103ad576100a3565b806342f1181e146102be578063494503d4146102f357806370712939146103395780638da5cb5b1461036c575b7fffffffff00000000000000000000000000000000000000000000000000000000600035167fa85e59e4000000000000000000000000000000000000000000000000000000008114156102b857604080513381526001602082015290812054610177577f08c379a0000000000000000000000000000000000000000000000000000000006000527c20000000000000000000000000000000000000000000000000000000006020527c1553454e4445525f4e4f545f415554484f52495a454400000000000000604052600060605260646000fd5b50600160643503156101f4577f08c379a0000000000000000000000000000000000000000000000000000000006000527c20000000000000000000000000000000000000000000000000000000006020527c0e494e56414c49445f414d4f554e540000000000000000000000000000604052600060605260646000fd5b7f23b872dd000000000000000000000000000000000000000000000000000000006000526040602460043760043560206048820160443760288101356000806064600080855af1915050801561024657005b507f08c379a0000000000000000000000000000000000000000000000000000000006000527c20000000000000000000000000000000000000000000000000000000006020527c0f5452414e534645525f4641494c454400000000000000000000000000604052600060605260646000fd5b50600080fd5b6102f1600480360360208110156102d457600080fd5b503573ffffffffffffffffffffffffffffffffffffffff166104bc565b005b6103106004803603602081101561030957600080fd5b50356106a8565b6040805173ffffffffffffffffffffffffffffffffffffffff9092168252519081900360200190f35b6102f16004803603602081101561034f57600080fd5b503573ffffffffffffffffffffffffffffffffffffffff166106dc565b6103106109cf565b6102f16004803603604081101561038a57600080fd5b5073ffffffffffffffffffffffffffffffffffffffff81351690602001356109eb565b6103b5610d9c565b604080517fffffffff000000000000000000000000000000000000000000000000000000009092168252519081900360200190f35b61041d6004803603602081101561040057600080fd5b503573ffffffffffffffffffffffffffffffffffffffff16610dd2565b604080519115158252519081900360200190f35b610439610de7565b60408051602080825283518183015283519192839290830191858101910280838360005b8381101561047557818101518382015260200161045d565b505050509050019250505060405180910390f35b6102f16004803603602081101561049f57600080fd5b503573ffffffffffffffffffffffffffffffffffffffff16610e56565b60005473ffffffffffffffffffffffffffffffffffffffff16331461054257604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601360248201527f4f4e4c595f434f4e54524143545f4f574e455200000000000000000000000000604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff811660009081526001602052604090205460ff16156105d757604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601960248201527f5441524745545f414c52454144595f415554484f52495a454400000000000000604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff8116600081815260016020819052604080832080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00168317905560028054928301815583527f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace90910180547fffffffffffffffffffffffff00000000000000000000000000000000000000001684179055513392917f3147867c59d17e8fa9d522465651d44aae0a9e38f902f3475b97e58072f0ed4c91a350565b600281815481106106b557fe5b60009182526020909120015473ffffffffffffffffffffffffffffffffffffffff16905081565b60005473ffffffffffffffffffffffffffffffffffffffff16331461076257604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601360248201527f4f4e4c595f434f4e54524143545f4f574e455200000000000000000000000000604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff811660009081526001602052604090205460ff166107f657604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601560248201527f5441524745545f4e4f545f415554484f52495a45440000000000000000000000604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff8116600090815260016020526040812080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001690555b600254811015610988578173ffffffffffffffffffffffffffffffffffffffff166002828154811061087057fe5b60009182526020909120015473ffffffffffffffffffffffffffffffffffffffff16141561098057600280547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81019081106108c857fe5b6000918252602090912001546002805473ffffffffffffffffffffffffffffffffffffffff90921691839081106108fb57fe5b600091825260209091200180547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055600280547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff019061097a9082610f3c565b50610988565b600101610842565b50604051339073ffffffffffffffffffffffffffffffffffffffff8316907f1f32c1b084e2de0713b8fb16bd46bb9df710a3dbeae2f3ca93af46e016dcc6b090600090a350565b60005473ffffffffffffffffffffffffffffffffffffffff1681565b60005473ffffffffffffffffffffffffffffffffffffffff163314610a7157604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601360248201527f4f4e4c595f434f4e54524143545f4f574e455200000000000000000000000000604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff821660009081526001602052604090205460ff16610b0557604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601560248201527f5441524745545f4e4f545f415554484f52495a45440000000000000000000000604482015290519081900360640190fd5b6002548110610b7557604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601360248201527f494e4445585f4f55545f4f465f424f554e445300000000000000000000000000604482015290519081900360640190fd5b8173ffffffffffffffffffffffffffffffffffffffff1660028281548110610b9957fe5b60009182526020909120015473ffffffffffffffffffffffffffffffffffffffff1614610c2757604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601b60248201527f415554484f52495a45445f414444524553535f4d49534d415443480000000000604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff8216600090815260016020526040902080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00169055600280547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8101908110610ca257fe5b6000918252602090912001546002805473ffffffffffffffffffffffffffffffffffffffff9092169183908110610cd557fe5b600091825260209091200180547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055600280547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0190610d549082610f3c565b50604051339073ffffffffffffffffffffffffffffffffffffffff8416907f1f32c1b084e2de0713b8fb16bd46bb9df710a3dbeae2f3ca93af46e016dcc6b090600090a35050565b604080517f455243373231546f6b656e28616464726573732c75696e7432353629000000008152905190819003601c0190205b90565b60016020526000908152604090205460ff1681565b60606002805480602002602001604051908101604052809291908181526020018280548015610e4c57602002820191906000526020600020905b815473ffffffffffffffffffffffffffffffffffffffff168152600190910190602001808311610e21575b5050505050905090565b60005473ffffffffffffffffffffffffffffffffffffffff163314610edc57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601360248201527f4f4e4c595f434f4e54524143545f4f574e455200000000000000000000000000604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff811615610f3957600080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff83161790555b50565b815481835581811115610f6057600083815260209020610f60918101908301610f65565b505050565b610dcf91905b80821115610f7f5760008155600101610f6b565b509056fea265627a7a723158201e53a891f6df3931041b820f71387e9eecd97f7ea0d346c54fab37668bd022ec64736f6c634300050b0032';
    private _methodABIIndex: { [name: string]: number } = {};
    private readonly _subscriptionManager: SubscriptionManager<ERC721ProxyEventArgs, ERC721ProxyEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<ERC721ProxyContract> {
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        if (artifact.compilerOutput === undefined) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        const logDecodeDependenciesAbiOnly: { [contractName: string]: ContractAbi } = {};
        if (Object.keys(logDecodeDependencies) !== undefined) {
            for (const key of Object.keys(logDecodeDependencies)) {
                logDecodeDependenciesAbiOnly[key] = logDecodeDependencies[key].compilerOutput.abi;
            }
        }
        return ERC721ProxyContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
    ): Promise<ERC721ProxyContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [] = BaseContract._formatABIDataItemList(constructorAbi.inputs, [], BaseContract._bigNumberToString);
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, []);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`ERC721Proxy successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ERC721ProxyContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [];
        return contractInstance;
    }

    /**
     * @returns      The contract ABI
     */
    public static ABI(): ContractAbi {
        const abi = [
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
                constant: true,
                inputs: [],
                name: 'getProxyId',
                outputs: [
                    {
                        name: '',
                        type: 'bytes4',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
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
                inputs: [],
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'fallback',
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
        ] as ContractAbi;
        return abi;
    }

    public getFunctionSignature(methodName: string): string {
        const index = this._methodABIIndex[methodName];
        const methodAbi = ERC721ProxyContract.ABI()[index] as MethodAbi;
        const functionSignature = methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    }
    public getABIDecodedTransactionData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as ERC721ProxyContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecode<T>(callData);
        return abiDecodedCallData;
    }
    public getABIDecodedReturnData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as ERC721ProxyContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecodeReturnValue<T>(callData);
        return abiDecodedCallData;
    }
    public getSelector(methodName: string): string {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as ERC721ProxyContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    }

    /**
     * Authorizes an address.
     * @param target Address to authorize.
     */
    public addAuthorizedAddress(target: string): ContractTxFunctionObj<void> {
        const self = (this as any) as ERC721ProxyContract;
        assert.isString('target', target);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('addAuthorizedAddress(address)', [
                    target.toLowerCase(),
                ]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }

                const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                return txHash;
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                const txHashPromise = this.sendTransactionAsync(txData, opts);
                return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                    txHashPromise,
                    (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                        // When the transaction hash resolves, wait for it to be mined.
                        return self._web3Wrapper.awaitTransactionSuccessAsync(
                            await txHashPromise,
                            opts.pollingIntervalMs,
                            opts.timeoutMs,
                        );
                    })(),
                );
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments('addAuthorizedAddress(address)', [
                    target.toLowerCase(),
                ]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
                return gas;
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('addAuthorizedAddress(address)', [
                    target.toLowerCase(),
                ]);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('addAuthorizedAddress(address)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('addAuthorizedAddress(address)', [
                    target.toLowerCase(),
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    public authorities(index_0: BigNumber): ContractFunctionObj<string> {
        const self = (this as any) as ERC721ProxyContract;
        assert.isBigNumber('index_0', index_0);

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('authorities(uint256)', [index_0]);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('authorities(uint256)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('authorities(uint256)', [index_0]);
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Removes authorizion of an address.
     * @param target Address to remove authorization from.
     */
    public removeAuthorizedAddress(target: string): ContractTxFunctionObj<void> {
        const self = (this as any) as ERC721ProxyContract;
        assert.isString('target', target);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('removeAuthorizedAddress(address)', [
                    target.toLowerCase(),
                ]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }

                const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                return txHash;
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                const txHashPromise = this.sendTransactionAsync(txData, opts);
                return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                    txHashPromise,
                    (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                        // When the transaction hash resolves, wait for it to be mined.
                        return self._web3Wrapper.awaitTransactionSuccessAsync(
                            await txHashPromise,
                            opts.pollingIntervalMs,
                            opts.timeoutMs,
                        );
                    })(),
                );
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments('removeAuthorizedAddress(address)', [
                    target.toLowerCase(),
                ]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
                return gas;
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('removeAuthorizedAddress(address)', [
                    target.toLowerCase(),
                ]);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('removeAuthorizedAddress(address)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('removeAuthorizedAddress(address)', [
                    target.toLowerCase(),
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    public owner(): ContractFunctionObj<string> {
        const self = (this as any) as ERC721ProxyContract;

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('owner()', []);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('owner()');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('owner()', []);
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Removes authorizion of an address.
     * @param target Address to remove authorization from.
     * @param index Index of target in authorities array.
     */
    public removeAuthorizedAddressAtIndex(target: string, index: BigNumber): ContractTxFunctionObj<void> {
        const self = (this as any) as ERC721ProxyContract;
        assert.isString('target', target);
        assert.isBigNumber('index', index);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('removeAuthorizedAddressAtIndex(address,uint256)', [
                    target.toLowerCase(),
                    index,
                ]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }

                const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                return txHash;
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                const txHashPromise = this.sendTransactionAsync(txData, opts);
                return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                    txHashPromise,
                    (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                        // When the transaction hash resolves, wait for it to be mined.
                        return self._web3Wrapper.awaitTransactionSuccessAsync(
                            await txHashPromise,
                            opts.pollingIntervalMs,
                            opts.timeoutMs,
                        );
                    })(),
                );
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments('removeAuthorizedAddressAtIndex(address,uint256)', [
                    target.toLowerCase(),
                    index,
                ]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
                return gas;
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('removeAuthorizedAddressAtIndex(address,uint256)', [
                    target.toLowerCase(),
                    index,
                ]);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('removeAuthorizedAddressAtIndex(address,uint256)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments(
                    'removeAuthorizedAddressAtIndex(address,uint256)',
                    [target.toLowerCase(), index],
                );
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Gets the proxy id associated with the proxy address.
     * @returns Proxy id.
     */
    public getProxyId(): ContractFunctionObj<string> {
        const self = (this as any) as ERC721ProxyContract;

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('getProxyId()', []);
                let rawCallResult;

                const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');
                try {
                    rawCallResult = await self._evmExecAsync(encodedDataBytes);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('getProxyId()');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('getProxyId()', []);
                return abiEncodedTransactionData;
            },
        };
    }
    public authorized(index_0: string): ContractFunctionObj<boolean> {
        const self = (this as any) as ERC721ProxyContract;
        assert.isString('index_0', index_0);

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<boolean> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('authorized(address)', [index_0.toLowerCase()]);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('authorized(address)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('authorized(address)', [
                    index_0.toLowerCase(),
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Gets all authorized addresses.
     * @returns Array of authorized addresses.
     */
    public getAuthorizedAddresses(): ContractFunctionObj<string[]> {
        const self = (this as any) as ERC721ProxyContract;

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string[]> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('getAuthorizedAddresses()', []);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('getAuthorizedAddresses()');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string[]>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('getAuthorizedAddresses()', []);
                return abiEncodedTransactionData;
            },
        };
    }
    public transferOwnership(newOwner: string): ContractTxFunctionObj<void> {
        const self = (this as any) as ERC721ProxyContract;
        assert.isString('newOwner', newOwner);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }

                const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                return txHash;
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                const txHashPromise = this.sendTransactionAsync(txData, opts);
                return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                    txHashPromise,
                    (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                        // When the transaction hash resolves, wait for it to be mined.
                        return self._web3Wrapper.awaitTransactionSuccessAsync(
                            await txHashPromise,
                            opts.pollingIntervalMs,
                            opts.timeoutMs,
                        );
                    })(),
                );
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
                return gas;
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('transferOwnership(address)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('transferOwnership(address)', [
                    newOwner.toLowerCase(),
                ]);
                return abiEncodedTransactionData;
            },
        };
    }

    /**
     * Subscribe to an event type emitted by the ERC721Proxy contract.
     * @param eventName The ERC721Proxy contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends ERC721ProxyEventArgs>(
        eventName: ERC721ProxyEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, ERC721ProxyEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            ERC721ProxyContract.ABI(),
            callback,
            isVerbose,
            blockPollingIntervalMs,
        );
        return subscriptionToken;
    }
    /**
     * Cancel a subscription
     * @param subscriptionToken Subscription token returned by `subscribe()`
     */
    public unsubscribe(subscriptionToken: string): void {
        this._subscriptionManager.unsubscribe(subscriptionToken);
    }
    /**
     * Cancels all existing subscriptions
     */
    public unsubscribeAll(): void {
        this._subscriptionManager.unsubscribeAll();
    }
    /**
     * Gets historical logs without creating a subscription
     * @param eventName The ERC721Proxy contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends ERC721ProxyEventArgs>(
        eventName: ERC721ProxyEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, ERC721ProxyEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            ERC721ProxyContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = ERC721ProxyContract.deployedBytecode,
    ) {
        super(
            'ERC721Proxy',
            ERC721ProxyContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<ERC721ProxyEventArgs, ERC721ProxyEvents>(
            ERC721ProxyContract.ABI(),
            this._web3Wrapper,
        );
        ERC721ProxyContract.ABI().forEach((item, index) => {
            if (item.type === 'function') {
                const methodAbi = item as MethodAbi;
                this._methodABIIndex[methodAbi.name] = index;
            }
        });
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
