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

export type AbiGenDummyEventArgs = AbiGenDummySimpleEventEventArgs | AbiGenDummyWithdrawalEventArgs;

export enum AbiGenDummyEvents {
    SimpleEvent = 'SimpleEvent',
    Withdrawal = 'Withdrawal',
}

export interface AbiGenDummySimpleEventEventArgs extends DecodedLogArgs {
    someBytes: string;
    someString: string;
}

export interface AbiGenDummyWithdrawalEventArgs extends DecodedLogArgs {
    _owner: string;
    _value: BigNumber;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class AbiGenDummyContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode =
        '0x608060405234801561001057600080fd5b50600436106101d95760003560e01c806376f15d5b11610104578063bb607362116100a2578063d88be12f11610071578063d88be12f1461039b578063ee8b86fb146103a3578063f408fb3114610279578063fa315f9d146103b6576101d9565b8063bb60736214610353578063bdab168814610369578063cd3c0b971461037e578063d6d7618c14610386576101d9565b80638ee52b4e116100de5780638ee52b4e146103225780639a3b618514610335578063a3c2f6b61461033d578063ae2dae1714610345576101d9565b806376f15d5b146102f25780637833bec0146102fa5780637a791e6e1461031a576101d9565b80634303a5421161017c57806359c28add1161014b57806359c28add146102b45780635ba3c7c0146102c957806363d69c88146102d1578063647341eb146102e4576101d9565b80634303a542146102875780634582eab21461028f57806345fdbdb714610297578063586f84b21461029f576101d9565b80632e1a7d4d116101b85780632e1a7d4d146102245780633687617d1461023757806336b32396146102595780633e9ef66a14610279576101d9565b806209e437146101de5780630527c28f146101e85780631310e444146101fb575b600080fd5b6101e66103c4565b005b6101e66101f6366004610c7f565b610401565b61020e610209366004610d87565b610404565b60405161021b91906113e8565b60405180910390f35b6101e6610232366004610d87565b61040b565b61024a610245366004610efc565b61045c565b60405161021b93929190611151565b61026c610267366004610d0b565b6104fc565b60405161021b9190611094565b6101e66101f6366004610d4c565b61020e6105de565b6101e66105e5565b6101e661064a565b6102a761067c565b60405161021b9190611373565b6102bc610684565b60405161021b919061137e565b6101e661068c565b61026c6102df366004610c2e565b6106f1565b6101e66101f6366004610ec9565b61020e6106fa565b61030d610308366004610d9f565b610708565b60405161021b9190611287565b6101e66107c5565b61020e610330366004610d87565b6107ca565b6101e66107d0565b61020e6107db565b6101e66101f6366004610e39565b61035b6107e0565b60405161021b9291906113f1565b610371610819565b60405161021b91906110b5565b6101e661081e565b61038e610855565b60405161021b91906113d5565b61020e6109ae565b6101e66103b1366004610d87565b6101f6565b6101e66101f6366004610d87565b6040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103f690611250565b60405180910390fd5b565b50565b506107c790565b3373ffffffffffffffffffffffffffffffffffffffff167f7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b658260405161045191906113e8565b60405180910390a250565b505060408051808201825260048082527f1234567800000000000000000000000000000000000000000000000000000000602080840191909152835180850185528281527f87654321000000000000000000000000000000000000000000000000000000008183015284518086019095529184527f616d657400000000000000000000000000000000000000000000000000000000908401529093909250565b600060606040518060400160405280601c81526020017f19457468657265756d205369676e6564204d6573736167653a0a33320000000081525090506000818760405160200161054d929190611072565b604051602081830303815290604052805190602001209050600181878787604051600081526020016040526040516105889493929190611133565b6020604051602081039080840390855afa1580156105aa573d6000803e3d6000fd5b50506040517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0015198975050505050505050565b6107c75b90565b604080518082018252601481527f5245564552545f574954485f434f4e5354414e54000000000000000000000000602082015290517f08c379a00000000000000000000000000000000000000000000000000000000081526103f69190600401611193565b6040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103f690611219565b6105e26109b4565b6105e26109cc565b604080518082018252601581527f524551554952455f574954485f434f4e5354414e540000000000000000000000602082015290517f08c379a00000000000000000000000000000000000000000000000000000000081526103f69190600401611193565b50929392505050565b600080546001019081905590565b6107106109ec565b50604080516080810182529182528051808201825260048082527f123456780000000000000000000000000000000000000000000000000000000060208381019190915280850192909252825180840184528181527f87654321000000000000000000000000000000000000000000000000000000008184015284840152825180840190935282527f616d65740000000000000000000000000000000000000000000000000000000090820152606082015290565b6103ff565b60010190565b600080546001019055565b600190565b60408051808201909152600581527f68656c6c6f0000000000000000000000000000000000000000000000000000006020820152600191565b606090565b7f61a6029a4c7ddee5824d171331eecbd015d26a271310a223718b837facb5b77160405161084b906111ad565b60405180910390a1565b61085d610a1a565b6040805160028082526060828101909352816020015b60608152602001906001900390816108735790505090506040518060400160405280600581526020017f3078313233000000000000000000000000000000000000000000000000000000815250816000815181106108cd57fe5b60200260200101819052506040518060400160405280600581526020017f30783332310000000000000000000000000000000000000000000000000000008152508160018151811061091b57fe5b6020908102919091018101919091526040805160c0810182526005608082018181527f307831323300000000000000000000000000000000000000000000000000000060a0840152825281840152808201939093528051808201909152600381527f6162630000000000000000000000000000000000000000000000000000000000918101919091526060820152905090565b6104d290565b60405180602001604052806109c7610a48565b905290565b60405180604001604052806109df610a1a565b8152602001606081525090565b60405180608001604052806109ff610a5b565b81526020016060815260200160608152602001606081525090565b604051806080016040528060608152602001600063ffffffff16815260200160608152602001606081525090565b6040518060200160405280600081525090565b60405180606001604052806000815260200160608152602001606081525090565b600082601f830112610a8c578081fd5b8135610a9f610a9a82611431565b61140a565b8181529150602080830190840160005b83811015610adc57610ac78760208435890101610ae6565b83526020928301929190910190600101610aaf565b5050505092915050565b600082601f830112610af6578081fd5b813567ffffffffffffffff811115610b0c578182fd5b610b3d60207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8401160161140a565b9150808252836020828501011115610b5457600080fd5b8060208401602084013760009082016020015292915050565b600060808284031215610b7e578081fd5b610b88608061140a565b9050813567ffffffffffffffff80821115610ba257600080fd5b610bae85838601610ae6565b8352610bbd8560208601610c14565b60208401526040840135915080821115610bd657600080fd5b610be285838601610a7c565b60408401526060840135915080821115610bfb57600080fd5b50610c0884828501610ae6565b60608301525092915050565b803563ffffffff81168114610c2857600080fd5b92915050565b600080600080600060a08688031215610c45578081fd5b8535610c5081611481565b945060208601359350604086013592506060860135610c6e81611481565b949793965091946080013592915050565b60006020808385031215610c91578182fd5b823567ffffffffffffffff811115610ca7578283fd5b80840185601f820112610cb8578384fd5b80359150610cc8610a9a83611431565b82815283810190828501865b85811015610cfd57610ceb8a888435880101610ae6565b84529286019290860190600101610cd4565b509098975050505050505050565b60008060008060808587031215610d20578384fd5b84359350602085013560ff81168114610d37578384fd5b93969395505050506040820135916060013590565b600060208284031215610d5d578081fd5b813567ffffffffffffffff811115610d73578182fd5b610d7f84828501610ae6565b949350505050565b600060208284031215610d98578081fd5b5035919050565b600060208284031215610db0578081fd5b813567ffffffffffffffff80821115610dc7578283fd5b81840160608187031215610dd9578384fd5b610de3606061140a565b925080358352602081013582811115610dfa578485fd5b610e0687828401610ae6565b602085015250604081013582811115610e1d578485fd5b610e2987828401610ae6565b6040850152509195945050505050565b600060208284031215610e4a578081fd5b813567ffffffffffffffff80821115610e61578283fd5b81840160408187031215610e73578384fd5b610e7d604061140a565b9250803582811115610e8d578485fd5b610e9987828401610b6d565b845250602081013582811115610ead578485fd5b610eb987828401610ae6565b6020850152509195945050505050565b600060208284031215610eda578081fd5b813567ffffffffffffffff811115610ef0578182fd5b610d7f84828501610b6d565b600080600060608486031215610f10578081fd5b83359250602084013567ffffffffffffffff80821115610f2e578283fd5b610f3a87838801610ae6565b93506040860135915080821115610f4f578283fd5b50610f5c86828701610ae6565b9150509250925092565b60008151808452610f7e816020860160208601611451565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b6000815160808452610fc56080850182610f66565b6020915063ffffffff828501511682860152604084015185820360408701528181518084528484019150848582028501018584018794505b8285101561104b577fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0868303018452611037828251610f66565b600195909501949387019391508601610ffd565b506060880151955088810360608a01526110658187610f66565b9998505050505050505050565b60008351611084818460208801611451565b9190910191825250602001919050565b73ffffffffffffffffffffffffffffffffffffffff91909116815260200190565b6000602080830181845280855180835260408601915060408482028701019250838701855b82811015611126577fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc0888603018452611114858351610fb0565b945092850192908501906001016110da565b5092979650505050505050565b93845260ff9290921660208401526040830152606082015260800190565b6000606082526111646060830186610f66565b82810360208401526111768186610f66565b83810360408501526111888186610f66565b979650505050505050565b6000602082526111a66020830184610f66565b9392505050565b60408082526004908201527f123456780000000000000000000000000000000000000000000000000000000060608201526080602082018190526005908201527f6c6f72656d00000000000000000000000000000000000000000000000000000060a082015260c00190565b6020808252600d908201527f53494d504c455f52455645525400000000000000000000000000000000000000604082015260600190565b6020808252600e908201527f53494d504c455f52455155495245000000000000000000000000000000000000604082015260600190565b600060208252825160806020840152805160a08401526020810151606060c08501526112b7610100850182610f66565b604083015191507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff608582030160e08601526112f28183610f66565b9250505060208401517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0808584030160408601526113308383610f66565b604087015193508186820301606087015261134b8185610f66565b92505060608601519250808583030160808601525061136a8183610f66565b95945050505050565b905151815260200190565b60006020825282516040602084015261139a6060840182610fb0565b602085015191507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe084820301604085015261136a8183610f66565b6000602082526111a66020830184610fb0565b90815260200190565b600083825260406020830152610d7f6040830184610f66565b60405181810167ffffffffffffffff8111828210171561142957600080fd5b604052919050565b600067ffffffffffffffff821115611447578081fd5b5060209081020190565b60005b8381101561146c578181015183820152602001611454565b8381111561147b576000848401525b50505050565b73ffffffffffffffffffffffffffffffffffffffff8116811461040157600080fdfea365627a7a723158204f5b227587475ada330d11bfb46020f41172555bd06234eaaad1a7d10a4c2a396c6578706572696d656e74616cf564736f6c634300050c0040';
    private readonly _methodABIIndex: { [name: string]: number } = {};
    private readonly _subscriptionManager: SubscriptionManager<AbiGenDummyEventArgs, AbiGenDummyEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<AbiGenDummyContract> {
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
        return AbiGenDummyContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
    ): Promise<AbiGenDummyContract> {
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
        const txDataWithDefaults = await BaseContract._applyDefaultsToContractTxDataAsync(
            {
                data: txData,
                ...txDefaults,
            },
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`AbiGenDummy successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new AbiGenDummyContract(
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
                anonymous: false,
                inputs: [
                    {
                        name: 'someBytes',
                        type: 'bytes',
                        indexed: false,
                    },
                    {
                        name: 'someString',
                        type: 'string',
                        indexed: false,
                    },
                ],
                name: 'SimpleEvent',
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
                constant: true,
                inputs: [
                    {
                        name: 'a',
                        type: 'bytes[]',
                    },
                ],
                name: 'acceptsAnArrayOfBytes',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'a',
                        type: 'bytes',
                    },
                ],
                name: 'acceptsBytes',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'complexInput',
                        type: 'tuple',
                        components: [
                            {
                                name: 'foo',
                                type: 'uint256',
                            },
                            {
                                name: 'bar',
                                type: 'bytes',
                            },
                            {
                                name: 'car',
                                type: 'string',
                            },
                        ],
                    },
                ],
                name: 'complexInputComplexOutput',
                outputs: [
                    {
                        name: '',
                        type: 'tuple',
                        components: [
                            {
                                name: 'input',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'foo',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'bar',
                                        type: 'bytes',
                                    },
                                    {
                                        name: 'car',
                                        type: 'string',
                                    },
                                ],
                            },
                            {
                                name: 'lorem',
                                type: 'bytes',
                            },
                            {
                                name: 'ipsum',
                                type: 'bytes',
                            },
                            {
                                name: 'dolor',
                                type: 'string',
                            },
                        ],
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
                        name: 'hash',
                        type: 'bytes32',
                    },
                    {
                        name: 'v',
                        type: 'uint8',
                    },
                    {
                        name: 'r',
                        type: 'bytes32',
                    },
                    {
                        name: 's',
                        type: 'bytes32',
                    },
                ],
                name: 'ecrecoverFn',
                outputs: [
                    {
                        name: 'signerAddress',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: false,
                inputs: [],
                name: 'emitSimpleEvent',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'methodReturningArrayOfStructs',
                outputs: [
                    {
                        name: '',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'someBytes',
                                type: 'bytes',
                            },
                            {
                                name: 'anInteger',
                                type: 'uint32',
                            },
                            {
                                name: 'aDynamicArrayOfBytes',
                                type: 'bytes[]',
                            },
                            {
                                name: 'aString',
                                type: 'string',
                            },
                        ],
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'methodReturningMultipleValues',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                    {
                        name: '',
                        type: 'string',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'methodUsingNestedStructWithInnerStructNotUsedElsewhere',
                outputs: [
                    {
                        name: '',
                        type: 'tuple',
                        components: [
                            {
                                name: 'innerStruct',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'aField',
                                        type: 'uint256',
                                    },
                                ],
                            },
                        ],
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
                        type: 'uint256',
                    },
                    {
                        name: 'index_1',
                        type: 'bytes',
                    },
                    {
                        name: 'index_2',
                        type: 'string',
                    },
                ],
                name: 'multiInputMultiOutput',
                outputs: [
                    {
                        name: '',
                        type: 'bytes',
                    },
                    {
                        name: '',
                        type: 'bytes',
                    },
                    {
                        name: '',
                        type: 'string',
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
                        name: 'n',
                        type: 'tuple',
                        components: [
                            {
                                name: 'innerStruct',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'someBytes',
                                        type: 'bytes',
                                    },
                                    {
                                        name: 'anInteger',
                                        type: 'uint32',
                                    },
                                    {
                                        name: 'aDynamicArrayOfBytes',
                                        type: 'bytes[]',
                                    },
                                    {
                                        name: 'aString',
                                        type: 'string',
                                    },
                                ],
                            },
                            {
                                name: 'description',
                                type: 'string',
                            },
                        ],
                    },
                ],
                name: 'nestedStructInput',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'nestedStructOutput',
                outputs: [
                    {
                        name: '',
                        type: 'tuple',
                        components: [
                            {
                                name: 'innerStruct',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'someBytes',
                                        type: 'bytes',
                                    },
                                    {
                                        name: 'anInteger',
                                        type: 'uint32',
                                    },
                                    {
                                        name: 'aDynamicArrayOfBytes',
                                        type: 'bytes[]',
                                    },
                                    {
                                        name: 'aString',
                                        type: 'string',
                                    },
                                ],
                            },
                            {
                                name: 'description',
                                type: 'string',
                            },
                        ],
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'noInputNoOutput',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'noInputSimpleOutput',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: false,
                inputs: [],
                name: 'nonPureMethod',
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
                constant: false,
                inputs: [],
                name: 'nonPureMethodThatReturnsNothing',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'a',
                        type: 'string',
                    },
                ],
                name: 'overloadedMethod',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'a',
                        type: 'int256',
                    },
                ],
                name: 'overloadedMethod',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'pureFunctionWithConstant',
                outputs: [
                    {
                        name: 'someConstant',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'requireWithConstant',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'revertWithConstant',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
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
                name: 'simpleInputNoOutput',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
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
                name: 'simpleInputSimpleOutput',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'simplePureFunction',
                outputs: [
                    {
                        name: 'result',
                        type: 'uint256',
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
                        name: 'x',
                        type: 'uint256',
                    },
                ],
                name: 'simplePureFunctionWithInput',
                outputs: [
                    {
                        name: 'sum',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'simpleRequire',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'simpleRevert',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 's',
                        type: 'tuple',
                        components: [
                            {
                                name: 'someBytes',
                                type: 'bytes',
                            },
                            {
                                name: 'anInteger',
                                type: 'uint32',
                            },
                            {
                                name: 'aDynamicArrayOfBytes',
                                type: 'bytes[]',
                            },
                            {
                                name: 'aString',
                                type: 'string',
                            },
                        ],
                    },
                ],
                name: 'structInput',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'structOutput',
                outputs: [
                    {
                        name: 's',
                        type: 'tuple',
                        components: [
                            {
                                name: 'someBytes',
                                type: 'bytes',
                            },
                            {
                                name: 'anInteger',
                                type: 'uint32',
                            },
                            {
                                name: 'aDynamicArrayOfBytes',
                                type: 'bytes[]',
                            },
                            {
                                name: 'aString',
                                type: 'string',
                            },
                        ],
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
                        name: 'x',
                        type: 'address',
                    },
                    {
                        name: 'a',
                        type: 'uint256',
                    },
                    {
                        name: 'b',
                        type: 'uint256',
                    },
                    {
                        name: 'y',
                        type: 'address',
                    },
                    {
                        name: 'c',
                        type: 'uint256',
                    },
                ],
                name: 'withAddressInput',
                outputs: [
                    {
                        name: 'z',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
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
        ] as ContractAbi;
        return abi;
    }

    public getFunctionSignature(methodName: string): string {
        const index = this._methodABIIndex[methodName];
        const methodAbi = AbiGenDummyContract.ABI()[index] as MethodAbi; // tslint:disable-line:no-unnecessary-type-assertion
        const functionSignature = methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    }
    public getABIDecodedTransactionData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as AbiGenDummyContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecode<T>(callData);
        return abiDecodedCallData;
    }
    public getABIDecodedReturnData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as AbiGenDummyContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecodeReturnValue<T>(callData);
        return abiDecodedCallData;
    }
    public getSelector(methodName: string): string {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as AbiGenDummyContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    }

    /**
     * a method that accepts an array of bytes
     * @param a the array of bytes being accepted
     */
    public acceptsAnArrayOfBytes(a: string[]): ContractFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;
        assert.isArray('a', a);
        const functionSignature = 'acceptsAnArrayOfBytes(bytes[])';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [a]);
            },
        };
    }
    public acceptsBytes(a: string): ContractFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;
        assert.isString('a', a);
        const functionSignature = 'acceptsBytes(bytes)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [a]);
            },
        };
    }
    /**
     * Tests decoding when the input and output are complex.
     */
    public complexInputComplexOutput(complexInput: {
        foo: BigNumber;
        bar: string;
        car: string;
    }): ContractFunctionObj<{
        input: { foo: BigNumber; bar: string; car: string };
        lorem: string;
        ipsum: string;
        dolor: string;
    }> {
        const self = (this as any) as AbiGenDummyContract;

        const functionSignature = 'complexInputComplexOutput((uint256,bytes,string))';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<{
                input: { foo: BigNumber; bar: string; car: string };
                lorem: string;
                ipsum: string;
                dolor: string;
            }> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<{
                    input: { foo: BigNumber; bar: string; car: string };
                    lorem: string;
                    ipsum: string;
                    dolor: string;
                }>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [complexInput]);
            },
        };
    }
    /**
     * test that devdocs will be generated and
     * that multiline devdocs will look okay
     * @param hash description of some hash. Let's make this line super long to
     *     demonstrate hanging indents for method params. It has to be more than
     *     one hundred twenty columns.
     * @param v some v, recovery id
     * @param r ECDSA r output
     * @param s ECDSA s output
     * @returns the signerAddress that created this signature.  this line too is super long in order to demonstrate the proper hanging indentation in generated code.
     */
    public ecrecoverFn(hash: string, v: number | BigNumber, r: string, s: string): ContractFunctionObj<string> {
        const self = (this as any) as AbiGenDummyContract;
        assert.isString('hash', hash);
        assert.isNumberOrBigNumber('v', v);
        assert.isString('r', r);
        assert.isString('s', s);
        const functionSignature = 'ecrecoverFn(bytes32,uint8,bytes32,bytes32)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [hash, v, r, s]);
            },
        };
    }
    public emitSimpleEvent(): ContractTxFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'emitSimpleEvent()';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: this.getABIEncodedTransactionData() },
                    this.estimateGasAsync.bind(this),
                );
                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }
                return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                    ...txData,
                    data: this.getABIEncodedTransactionData(),
                });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public methodReturningArrayOfStructs(): ContractFunctionObj<
        Array<{ someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string }>
    > {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'methodReturningArrayOfStructs()';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<
                Array<{ someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string }>
            > {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<
                    Array<{ someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string }>
                >(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public methodReturningMultipleValues(): ContractFunctionObj<[BigNumber, string]> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'methodReturningMultipleValues()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<[BigNumber, string]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<[BigNumber, string]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public methodUsingNestedStructWithInnerStructNotUsedElsewhere(): ContractFunctionObj<{
        innerStruct: { aField: BigNumber };
    }> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'methodUsingNestedStructWithInnerStructNotUsedElsewhere()';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<{ innerStruct: { aField: BigNumber } }> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<{ innerStruct: { aField: BigNumber } }>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    /**
     * Tests decoding when the input and output are complex and have more than one argument.
     */
    public multiInputMultiOutput(
        index_0: BigNumber,
        index_1: string,
        index_2: string,
    ): ContractFunctionObj<[string, string, string]> {
        const self = (this as any) as AbiGenDummyContract;
        assert.isBigNumber('index_0', index_0);
        assert.isString('index_1', index_1);
        assert.isString('index_2', index_2);
        const functionSignature = 'multiInputMultiOutput(uint256,bytes,string)';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<[string, string, string]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<[string, string, string]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [index_0, index_1, index_2]);
            },
        };
    }
    public nestedStructInput(n: {
        innerStruct: {
            someBytes: string;
            anInteger: number | BigNumber;
            aDynamicArrayOfBytes: string[];
            aString: string;
        };
        description: string;
    }): ContractFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;

        const functionSignature = 'nestedStructInput(((bytes,uint32,bytes[],string),string))';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [n]);
            },
        };
    }
    public nestedStructOutput(): ContractFunctionObj<{
        innerStruct: { someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string };
        description: string;
    }> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'nestedStructOutput()';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<{
                innerStruct: { someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string };
                description: string;
            }> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<{
                    innerStruct: {
                        someBytes: string;
                        anInteger: number;
                        aDynamicArrayOfBytes: string[];
                        aString: string;
                    };
                    description: string;
                }>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    /**
     * Tests decoding when both input and output are empty.
     */
    public noInputNoOutput(): ContractFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'noInputNoOutput()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    /**
     * Tests decoding when input is empty and output is non-empty.
     */
    public noInputSimpleOutput(): ContractFunctionObj<BigNumber> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'noInputSimpleOutput()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public nonPureMethod(): ContractTxFunctionObj<BigNumber> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'nonPureMethod()';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: this.getABIEncodedTransactionData() },
                    this.estimateGasAsync.bind(this),
                );
                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }
                return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                    ...txData,
                    data: this.getABIEncodedTransactionData(),
                });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public nonPureMethodThatReturnsNothing(): ContractTxFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'nonPureMethodThatReturnsNothing()';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: this.getABIEncodedTransactionData() },
                    this.estimateGasAsync.bind(this),
                );
                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }
                return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                    ...txData,
                    data: this.getABIEncodedTransactionData(),
                });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public overloadedMethod2(a: string): ContractFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;
        assert.isString('a', a);
        const functionSignature = 'overloadedMethod(string)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [a]);
            },
        };
    }
    public overloadedMethod1(a: BigNumber): ContractFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;
        assert.isBigNumber('a', a);
        const functionSignature = 'overloadedMethod(int256)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [a]);
            },
        };
    }
    public pureFunctionWithConstant(): ContractFunctionObj<BigNumber> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'pureFunctionWithConstant()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public requireWithConstant(): ContractFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'requireWithConstant()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public revertWithConstant(): ContractFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'revertWithConstant()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    /**
     * Tests decoding when input is not empty but output is empty.
     */
    public simpleInputNoOutput(index_0: BigNumber): ContractFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;
        assert.isBigNumber('index_0', index_0);
        const functionSignature = 'simpleInputNoOutput(uint256)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [index_0]);
            },
        };
    }
    /**
     * Tests decoding when both input and output are non-empty.
     */
    public simpleInputSimpleOutput(index_0: BigNumber): ContractFunctionObj<BigNumber> {
        const self = (this as any) as AbiGenDummyContract;
        assert.isBigNumber('index_0', index_0);
        const functionSignature = 'simpleInputSimpleOutput(uint256)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [index_0]);
            },
        };
    }
    public simplePureFunction(): ContractFunctionObj<BigNumber> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'simplePureFunction()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public simplePureFunctionWithInput(x: BigNumber): ContractFunctionObj<BigNumber> {
        const self = (this as any) as AbiGenDummyContract;
        assert.isBigNumber('x', x);
        const functionSignature = 'simplePureFunctionWithInput(uint256)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [x]);
            },
        };
    }
    public simpleRequire(): ContractFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'simpleRequire()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public simpleRevert(): ContractFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'simpleRevert()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public structInput(s: {
        someBytes: string;
        anInteger: number | BigNumber;
        aDynamicArrayOfBytes: string[];
        aString: string;
    }): ContractFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;

        const functionSignature = 'structInput((bytes,uint32,bytes[],string))';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [s]);
            },
        };
    }
    /**
     * a method that returns a struct
     * @returns a Struct struct
     */
    public structOutput(): ContractFunctionObj<{
        someBytes: string;
        anInteger: number;
        aDynamicArrayOfBytes: string[];
        aString: string;
    }> {
        const self = (this as any) as AbiGenDummyContract;
        const functionSignature = 'structOutput()';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<{ someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string }> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<{
                    someBytes: string;
                    anInteger: number;
                    aDynamicArrayOfBytes: string[];
                    aString: string;
                }>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public withAddressInput(
        x: string,
        a: BigNumber,
        b: BigNumber,
        y: string,
        c: BigNumber,
    ): ContractFunctionObj<string> {
        const self = (this as any) as AbiGenDummyContract;
        assert.isString('x', x);
        assert.isBigNumber('a', a);
        assert.isBigNumber('b', b);
        assert.isString('y', y);
        assert.isBigNumber('c', c);
        const functionSignature = 'withAddressInput(address,uint256,uint256,address,uint256)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [x.toLowerCase(), a, b, y.toLowerCase(), c]);
            },
        };
    }
    public withdraw(wad: BigNumber): ContractTxFunctionObj<void> {
        const self = (this as any) as AbiGenDummyContract;
        assert.isBigNumber('wad', wad);
        const functionSignature = 'withdraw(uint256)';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: this.getABIEncodedTransactionData() },
                    this.estimateGasAsync.bind(this),
                );
                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }
                return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                    ...txData,
                    data: this.getABIEncodedTransactionData(),
                });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [wad]);
            },
        };
    }

    /**
     * Subscribe to an event type emitted by the AbiGenDummy contract.
     * @param eventName The AbiGenDummy contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends AbiGenDummyEventArgs>(
        eventName: AbiGenDummyEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, AbiGenDummyEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            AbiGenDummyContract.ABI(),
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
     * @param eventName The AbiGenDummy contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends AbiGenDummyEventArgs>(
        eventName: AbiGenDummyEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, AbiGenDummyEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            AbiGenDummyContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = AbiGenDummyContract.deployedBytecode,
    ) {
        super(
            'AbiGenDummy',
            AbiGenDummyContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<AbiGenDummyEventArgs, AbiGenDummyEvents>(
            AbiGenDummyContract.ABI(),
            this._web3Wrapper,
        );
        AbiGenDummyContract.ABI().forEach((item, index) => {
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
