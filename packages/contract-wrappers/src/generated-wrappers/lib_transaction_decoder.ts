// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma enum-naming
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import {
    AwaitTransactionSuccessOpts,
    ContractFunctionObj,
    ContractTxFunctionObj,
    SendTransactionOpts,
    BaseContract,
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

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class LibTransactionDecoderContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode =
        '0x608060405234801561001057600080fd5b506004361061002b5760003560e01c80636f83188e14610030575b600080fd5b61004361003e36600461106a565b61005c565b6040516100539493929190611309565b60405180910390f35b60608080806000610073868263ffffffff61087216565b90506001600160e01b0319811663dedfc1f160e01b14156100bf5760405180604001604052806011815260200170626174636843616e63656c4f726465727360781b8152509450610474565b6001600160e01b03198116634b4a520160e11b1415610107576040518060400160405280600f81526020016e626174636846696c6c4f726465727360881b8152509450610474565b6001600160e01b031981166323aa37f960e21b14156101565760405180604001604052806016815260200175626174636846696c6c4f72646572734e6f5468726f7760501b8152509450610474565b6001600160e01b03198116632fbb8b8560e21b14156101a45760405180604001604052806015815260200174626174636846696c6c4f724b696c6c4f726465727360581b8152509450610474565b6001600160e01b03198116632da6298760e01b14156101e8576040518060400160405280600b81526020016a31b0b731b2b627b93232b960a91b8152509450610474565b6001600160e01b03198116634da26aab60e11b141561022a57604051806040016040528060098152602001683334b63627b93232b960b91b8152509450610474565b6001600160e01b03198116633852d63160e21b1415610272576040518060400160405280600f81526020016e3334b63627b925b4b63627b93232b960891b8152509450610474565b6001600160e01b031981166378d29ac160e01b14156102c157604051806040016040528060168152602001756d61726b65744275794f72646572734e6f5468726f7760501b8152509450610474565b6001600160e01b0319811663369da09960e01b1415610317576040518060400160405280601781526020017f6d61726b657453656c6c4f72646572734e6f5468726f770000000000000000008152509450610474565b6001600160e01b03198116638bc8efb360e01b141561036d576040518060400160405280601981526020017f6d61726b65744275794f726465727346696c6c4f724b696c6c000000000000008152509450610474565b6001600160e01b0319811663a6c3bf3360e01b14156103c3576040518060400160405280601a81526020017f6d61726b657453656c6c4f726465727346696c6c4f724b696c6c0000000000008152509450610474565b6001600160e01b031981166388ec79fb60e01b1415610407576040518060400160405280600b81526020016a6d617463684f726465727360a81b8152509450610474565b6001600160e01b03198116634f9559b160e01b148061043657506001600160e01b031981166302280c9160e41b145b1561045c5760405162461bcd60e51b8152600401610453906114c6565b60405180910390fd5b60405162461bcd60e51b81526004016104539061148f565b6001600160e01b0319811663dedfc1f160e01b14156105005785516104a390879060049063ffffffff6108b516565b8060200190516104b69190810190610eff565b604080516000808252602082019092529195505b50604080516000808252602082019092529194506104f8565b60608152602001906001900390816104e35790505b50915061086a565b6001600160e01b03198116632fbb8b8560e21b148061052f57506001600160e01b03198116634b4a520160e11b145b8061054a57506001600160e01b031981166323aa37f960e21b145b15610564576105588661093c565b9195509350915061086a565b6001600160e01b03198116632da6298760e01b14156106335760408051600180825281830190925290816020015b61059a610bf4565b81526020019060019003908161059257505086519094506105c590879060049063ffffffff6108b516565b8060200190516105d891908101906110e1565b846000815181106105e557fe5b602002602001018190525060006040519080825280602002602001820160405280156104ca5781602001602082028038833901905050604080516000808252602082019092529194506104f8565b6001600160e01b03198116633852d63160e21b148061066257506001600160e01b03198116634da26aab60e11b145b156106705761055886610978565b6001600160e01b031981166378d29ac160e01b148061069f57506001600160e01b0319811663369da09960e01b145b806106ba57506001600160e01b03198116638bc8efb360e01b145b806106d557506001600160e01b0319811663a6c3bf3360e01b145b156106e35761055886610a72565b6001600160e01b031981166388ec79fb60e01b141561086a57610704610bf4565b61070c610bf4565b60608061072660048b518c6108b59092919063ffffffff16565b8060200190516107399190810190611114565b604080516002808252606082019092529498509296509094509250816020015b610761610bf4565b815260200190600190039081610759579050509750838860008151811061078457fe5b6020026020010181905250828860018151811061079d57fe5b602090810291909101015260408051600280825260608201909252908160200160208202803883390190505096508360a00151876000815181106107dd57fe5b6020026020010181815250508260a00151876001815181106107fb57fe5b60209081029190910101526040805160028082526060820190925290816020015b606081526020019060019003908161081c579050509550818660008151811061084157fe5b6020026020010181905250808660018151811061085a57fe5b6020026020010181905250505050505b509193509193565b60008160040183511015610898576108986108936003855185600401610ae6565b610b40565b5060208183018101519101906001600160e01b0319165b92915050565b6060818311156108ce576108ce61089360008585610ae6565b83518211156108e7576108e76108936001848751610ae6565b8282036040519080825280601f01601f191660200182016040528015610914576020820181803883390190505b50905061093561092382610b48565b8461092d87610b48565b018351610b4e565b9392505050565b606080606061095860048551866108b59092919063ffffffff16565b80602001905161096b9190810190610f3a565b9196909550909350915050565b60408051600180825281830190925260609182918291816020015b61099b610bf4565b8152602001906001900390816109935750506040805160018082528183019092529194506020808301908038833901905050604080516001808252818301909252919350816020015b60608152602001906001900390816109e45750508451909150610a1190859060049063ffffffff6108b516565b806020019051610a2491908101906111bc565b85600081518110610a3157fe5b6020026020010185600081518110610a4557fe5b6020026020010185600081518110610a5957fe5b6020908102919091010192909252919052529193909250565b604080516001808252818301909252606091829182916020808301908038833950508551919350610aae9186915060049063ffffffff6108b516565b806020019051610ac19190810190611017565b84518590600090610ace57fe5b60209081029190910101919091529095929450925050565b6060632800659560e01b848484604051602401610b05939291906112e7565b60408051601f198184030181529190526020810180516001600160e01b03166001600160e01b03199093169290921790915290509392505050565b805160208201fd5b60200190565b6020811015610b78576001816020036101000a038019835116818551168082178652505050610bef565b82821415610b8557610bef565b82821115610bbf5760208103905080820181840181515b82851015610bb7578451865260209586019590940193610b9c565b905250610bef565b60208103905080820181840183515b81861215610bea5782518252601f199283019290910190610bce565b855250505b505050565b604051806101c0016040528060006001600160a01b0316815260200160006001600160a01b0316815260200160006001600160a01b0316815260200160006001600160a01b03168152602001600081526020016000815260200160008152602001600081526020016000815260200160008152602001606081526020016060815260200160608152602001606081525090565b80516001600160a01b03811681146108af57600080fd5b600082601f830112610cae578081fd5b8151610cc1610cbc82611514565b6114ed565b8181529150602080830190840160005b83811015610cfe57610ce98760208451890101610d63565b83526020928301929190910190600101610cd1565b5050505092915050565b600082601f830112610d18578081fd5b8151610d26610cbc82611514565b8181529150602080830190840160005b83811015610cfe57610d4e8760208451890101610db0565b83526020928301929190910190600101610d36565b600082601f830112610d73578081fd5b8151610d81610cbc82611534565b9150808252836020828501011115610d9857600080fd5b610da9816020840160208601611558565b5092915050565b60006101c0808385031215610dc3578182fd5b610dcc816114ed565b915050610dd98383610c87565b8152610de88360208401610c87565b6020820152610dfa8360408401610c87565b6040820152610e0c8360608401610c87565b60608201526080820151608082015260a082015160a082015260c082015160c082015260e082015160e08201526101008083015181830152506101208083015181830152506101408083015167ffffffffffffffff80821115610e6e57600080fd5b610e7a86838701610d63565b83850152610160925082850151915080821115610e9657600080fd5b610ea286838701610d63565b83850152610180925082850151915080821115610ebe57600080fd5b610eca86838701610d63565b838501526101a0925082850151915080821115610ee657600080fd5b50610ef385828601610d63565b82840152505092915050565b600060208284031215610f10578081fd5b815167ffffffffffffffff811115610f26578182fd5b610f3284828501610d08565b949350505050565b600080600060608486031215610f4e578182fd5b835167ffffffffffffffff80821115610f65578384fd5b610f7187838801610d08565b9450602091508186015181811115610f87578485fd5b80870188601f820112610f98578586fd5b80519150610fa8610cbc83611514565b82815284810190828601868502840187018c1015610fc4578889fd5b8893505b84841015610fe6578051835260019390930192918601918601610fc8565b5060408a0151909750945050505080821115611000578283fd5b5061100d86828701610c9e565b9150509250925092565b60008060006060848603121561102b578283fd5b835167ffffffffffffffff80821115611042578485fd5b61104e87838801610d08565b9450602086015193506040860151915080821115611000578283fd5b60006020828403121561107b578081fd5b813567ffffffffffffffff811115611091578182fd5b80830184601f8201126110a2578283fd5b803591506110b2610cbc83611534565b8281528560208484010111156110c6578384fd5b82602083016020830137918201602001929092529392505050565b6000602082840312156110f2578081fd5b815167ffffffffffffffff811115611108578182fd5b610f3284828501610db0565b60008060008060808587031215611129578081fd5b845167ffffffffffffffff80821115611140578283fd5b61114c88838901610db0565b95506020870151915080821115611161578283fd5b61116d88838901610db0565b94506040870151915080821115611182578283fd5b61118e88838901610d63565b935060608701519150808211156111a3578283fd5b506111b087828801610d63565b91505092959194509250565b6000806000606084860312156111d0578283fd5b835167ffffffffffffffff808211156111e7578485fd5b6111f387838801610db0565b945060208601519350604086015191508082111561120f578283fd5b5061100d86828701610d63565b6001600160a01b03169052565b600081518084526020840180819550602083028101915060208501845b8481101561127457828403885261125e8483516112bb565b6020988901989094509190910190600101611246565b50919695505050505050565b6000815180845260208401935060208301825b828110156112b1578151865260209586019590910190600101611293565b5093949350505050565b600081518084526112d3816020860160208601611558565b601f01601f19169290920160200192915050565b60608101600885106112f557fe5b938152602081019290925260409091015290565b60006080825261131c60808301876112bb565b602083820381850152818751808452828401915082838202850101838a01865b8381101561145857601f1987840301855281516101c061135d85835161121c565b8782015161136d8987018261121c565b506040820151611380604087018261121c565b506060820151611393606087018261121c565b506080820151608086015260a082015160a086015260c082015160c086015260e082015160e08601526101008083015181870152506101208083015181870152506101408083015182828801526113ec838801826112bb565b9150506101609150818301518682038388015261140982826112bb565b92505050610180808301518683038288015261142583826112bb565b9150506101a09150818301518682038388015261144282826112bb565b988a01989650505092870192505060010161133c565b5050868103604088015261146c818a611280565b94505050505082810360608401526114848185611229565b979650505050505050565b60208082526019908201527f554e4b4e4f574e5f46554e4354494f4e5f53454c4543544f5200000000000000604082015260600190565b6020808252600d908201526c15539253541311535153951151609a1b604082015260600190565b60405181810167ffffffffffffffff8111828210171561150c57600080fd5b604052919050565b600067ffffffffffffffff82111561152a578081fd5b5060209081020190565b600067ffffffffffffffff82111561154a578081fd5b50601f01601f191660200190565b60005b8381101561157357818101518382015260200161155b565b83811115611582576000848401525b5050505056fea365627a7a72315820c2002bfd322b68d858b3bf2f9aefa64a017df176dbd274fc66c6b6644a7ad2306c6578706572696d656e74616cf564736f6c63430005100040';
    public static contractName = 'LibTransactionDecoder';
    private readonly _methodABIIndex: { [name: string]: number } = {};
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<LibTransactionDecoderContract> {
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
        return LibTransactionDecoderContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
    ): Promise<LibTransactionDecoderContract> {
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
        logUtils.log(`LibTransactionDecoder successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new LibTransactionDecoderContract(
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
                constant: true,
                inputs: [
                    {
                        name: 'transactionData',
                        type: 'bytes',
                    },
                ],
                name: 'decodeZeroExTransactionData',
                outputs: [
                    {
                        name: 'functionName',
                        type: 'string',
                    },
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
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
        ] as ContractAbi;
        return abi;
    }

    public getFunctionSignature(methodName: string): string {
        const index = this._methodABIIndex[methodName];
        const methodAbi = LibTransactionDecoderContract.ABI()[index] as MethodAbi; // tslint:disable-line:no-unnecessary-type-assertion
        const functionSignature = methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    }
    public getABIDecodedTransactionData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as LibTransactionDecoderContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecode<T>(callData);
        return abiDecodedCallData;
    }
    public getABIDecodedReturnData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as LibTransactionDecoderContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecodeReturnValue<T>(callData);
        return abiDecodedCallData;
    }
    public getSelector(methodName: string): string {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as LibTransactionDecoderContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    }

    /**
     * Decodes the call data for an Exchange contract method call.
     * @param transactionData ABI-encoded calldata for an Exchange     contract
     *     method call.
     * @returns The name of the function called, and the parameters it was     given.  For single-order fills and cancels, the arrays will have     just one element.
     */
    public decodeZeroExTransactionData(
        transactionData: string,
    ): ContractFunctionObj<
        [
            string,
            Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            BigNumber[],
            string[]
        ]
    > {
        const self = (this as any) as LibTransactionDecoderContract;
        assert.isString('transactionData', transactionData);
        const functionSignature = 'decodeZeroExTransactionData(bytes)';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<
                [
                    string,
                    Array<{
                        makerAddress: string;
                        takerAddress: string;
                        feeRecipientAddress: string;
                        senderAddress: string;
                        makerAssetAmount: BigNumber;
                        takerAssetAmount: BigNumber;
                        makerFee: BigNumber;
                        takerFee: BigNumber;
                        expirationTimeSeconds: BigNumber;
                        salt: BigNumber;
                        makerAssetData: string;
                        takerAssetData: string;
                        makerFeeAssetData: string;
                        takerFeeAssetData: string;
                    }>,
                    BigNumber[],
                    string[]
                ]
            > {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<
                    [
                        string,
                        Array<{
                            makerAddress: string;
                            takerAddress: string;
                            feeRecipientAddress: string;
                            senderAddress: string;
                            makerAssetAmount: BigNumber;
                            takerAssetAmount: BigNumber;
                            makerFee: BigNumber;
                            takerFee: BigNumber;
                            expirationTimeSeconds: BigNumber;
                            salt: BigNumber;
                            makerAssetData: string;
                            takerAssetData: string;
                            makerFeeAssetData: string;
                            takerFeeAssetData: string;
                        }>,
                        BigNumber[],
                        string[]
                    ]
                >(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [transactionData]);
            },
        };
    }

    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = LibTransactionDecoderContract.deployedBytecode,
    ) {
        super(
            'LibTransactionDecoder',
            LibTransactionDecoderContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        LibTransactionDecoderContract.ABI().forEach((item, index) => {
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
