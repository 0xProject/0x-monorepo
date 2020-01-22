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
        '0x608060405234801561001057600080fd5b506004361061002b5760003560e01c80636f83188e14610030575b600080fd5b61004361003e3660046113f4565b61005c565b604051610053949392919061176e565b60405180910390f35b60608080806000610073868263ffffffff610ba616565b90506001600160e01b031981167fdedfc1f10000000000000000000000000000000000000000000000000000000014156100e4576040518060400160405280601181526020017f626174636843616e63656c4f7264657273000000000000000000000000000000815250945061067c565b6001600160e01b031981167f9694a402000000000000000000000000000000000000000000000000000000001415610153576040518060400160405280600f81526020017f626174636846696c6c4f72646572730000000000000000000000000000000000815250945061067c565b6001600160e01b031981167f8ea8dfe40000000000000000000000000000000000000000000000000000000014156101c2576040518060400160405280601681526020017f626174636846696c6c4f72646572734e6f5468726f7700000000000000000000815250945061067c565b6001600160e01b031981167fbeee2e14000000000000000000000000000000000000000000000000000000001415610231576040518060400160405280601581526020017f626174636846696c6c4f724b696c6c4f72646572730000000000000000000000815250945061067c565b6001600160e01b031981167f2da629870000000000000000000000000000000000000000000000000000000014156102a0576040518060400160405280600b81526020017f63616e63656c4f72646572000000000000000000000000000000000000000000815250945061067c565b6001600160e01b031981167f9b44d55600000000000000000000000000000000000000000000000000000000141561030f576040518060400160405280600981526020017f66696c6c4f726465720000000000000000000000000000000000000000000000815250945061067c565b6001600160e01b031981167fe14b58c400000000000000000000000000000000000000000000000000000000141561037e576040518060400160405280600f81526020017f66696c6c4f724b696c6c4f726465720000000000000000000000000000000000815250945061067c565b6001600160e01b031981167f78d29ac10000000000000000000000000000000000000000000000000000000014156103ed576040518060400160405280601681526020017f6d61726b65744275794f72646572734e6f5468726f7700000000000000000000815250945061067c565b6001600160e01b031981167f369da09900000000000000000000000000000000000000000000000000000000141561045c576040518060400160405280601781526020017f6d61726b657453656c6c4f72646572734e6f5468726f77000000000000000000815250945061067c565b6001600160e01b031981167f8bc8efb30000000000000000000000000000000000000000000000000000000014156104cb576040518060400160405280601981526020017f6d61726b65744275794f726465727346696c6c4f724b696c6c00000000000000815250945061067c565b6001600160e01b031981167fa6c3bf3300000000000000000000000000000000000000000000000000000000141561053a576040518060400160405280601a81526020017f6d61726b657453656c6c4f726465727346696c6c4f724b696c6c000000000000815250945061067c565b6001600160e01b031981167f88ec79fb0000000000000000000000000000000000000000000000000000000014156105a9576040518060400160405280600b81526020017f6d617463684f7264657273000000000000000000000000000000000000000000815250945061067c565b6001600160e01b031981167f4f9559b100000000000000000000000000000000000000000000000000000000148061060a57506001600160e01b031981167f2280c91000000000000000000000000000000000000000000000000000000000145b1561064a576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106419061186d565b60405180910390fd5b6040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161064190611836565b6001600160e01b031981167fdedfc1f10000000000000000000000000000000000000000000000000000000014156107215785516106c490879060049063ffffffff610be916565b8060200190516106d79190810190611289565b604080516000808252602082019092529195505b5060408051600080825260208201909252919450610719565b60608152602001906001900390816107045790505b509150610b9e565b6001600160e01b031981167fbeee2e1400000000000000000000000000000000000000000000000000000000148061078257506001600160e01b031981167f9694a40200000000000000000000000000000000000000000000000000000000145b806107b657506001600160e01b031981167f8ea8dfe400000000000000000000000000000000000000000000000000000000145b156107d0576107c486610c70565b91955093509150610b9e565b6001600160e01b031981167f2da629870000000000000000000000000000000000000000000000000000000014156108b85760408051600180825281830190925290816020015b61081f610f3d565b815260200190600190039081610817575050865190945061084a90879060049063ffffffff610be916565b80602001905161085d919081019061146b565b8460008151811061086a57fe5b602002602001018190525060006040519080825280602002602001820160405280156106eb578160200160208202803883390190505060408051600080825260208201909252919450610719565b6001600160e01b031981167fe14b58c400000000000000000000000000000000000000000000000000000000148061091957506001600160e01b031981167f9b44d55600000000000000000000000000000000000000000000000000000000145b15610927576107c486610cac565b6001600160e01b031981167f78d29ac100000000000000000000000000000000000000000000000000000000148061098857506001600160e01b031981167f369da09900000000000000000000000000000000000000000000000000000000145b806109bc57506001600160e01b031981167f8bc8efb300000000000000000000000000000000000000000000000000000000145b806109f057506001600160e01b031981167fa6c3bf3300000000000000000000000000000000000000000000000000000000145b156109fe576107c486610da6565b6001600160e01b031981167f88ec79fb000000000000000000000000000000000000000000000000000000001415610b9e57610a38610f3d565b610a40610f3d565b606080610a5a60048b518c610be99092919063ffffffff16565b806020019051610a6d919081019061149e565b604080516002808252606082019092529498509296509094509250816020015b610a95610f3d565b815260200190600190039081610a8d5790505097508388600081518110610ab857fe5b60200260200101819052508288600181518110610ad157fe5b602090810291909101015260408051600280825260608201909252908160200160208202803883390190505096508360a0015187600081518110610b1157fe5b6020026020010181815250508260a0015187600181518110610b2f57fe5b60209081029190910101526040805160028082526060820190925290816020015b6060815260200190600190039081610b505790505095508186600081518110610b7557fe5b60200260200101819052508086600181518110610b8e57fe5b6020026020010181905250505050505b509193509193565b60008160040183511015610bcc57610bcc610bc76003855185600401610e1a565b610e89565b5060208183018101519101906001600160e01b0319165b92915050565b606081831115610c0257610c02610bc760008585610e1a565b8351821115610c1b57610c1b610bc76001848751610e1a565b8282036040519080825280601f01601f191660200182016040528015610c48576020820181803883390190505b509050610c69610c5782610e91565b84610c6187610e91565b018351610e97565b9392505050565b6060806060610c8c6004855186610be99092919063ffffffff16565b806020019051610c9f91908101906112c4565b9196909550909350915050565b60408051600180825281830190925260609182918291816020015b610ccf610f3d565b815260200190600190039081610cc75750506040805160018082528183019092529194506020808301908038833901905050604080516001808252818301909252919350816020015b6060815260200190600190039081610d185750508451909150610d4590859060049063ffffffff610be916565b806020019051610d589190810190611546565b85600081518110610d6557fe5b6020026020010185600081518110610d7957fe5b6020026020010185600081518110610d8d57fe5b6020908102919091010192909252919052529193909250565b604080516001808252818301909252606091829182916020808301908038833950508551919350610de29186915060049063ffffffff610be916565b806020019051610df591908101906113a1565b84518590600090610e0257fe5b60209081029190910101919091529095929450925050565b6060632800659560e01b848484604051602401610e399392919061174c565b60408051601f198184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff166001600160e01b03199093169290921790915290509392505050565b805160208201fd5b60200190565b6020811015610ec1576001816020036101000a038019835116818551168082178652505050610f38565b82821415610ece57610f38565b82821115610f085760208103905080820181840181515b82851015610f00578451865260209586019590940193610ee5565b905250610f38565b60208103905080820181840183515b81861215610f335782518252601f199283019290910190610f17565b855250505b505050565b604051806101c00160405280600073ffffffffffffffffffffffffffffffffffffffff168152602001600073ffffffffffffffffffffffffffffffffffffffff168152602001600073ffffffffffffffffffffffffffffffffffffffff168152602001600073ffffffffffffffffffffffffffffffffffffffff168152602001600081526020016000815260200160008152602001600081526020016000815260200160008152602001606081526020016060815260200160608152602001606081525090565b805173ffffffffffffffffffffffffffffffffffffffff81168114610be357600080fd5b600082601f830112611038578081fd5b815161104b611046826118cb565b6118a4565b8181529150602080830190840160005b838110156110885761107387602084518901016110ed565b8352602092830192919091019060010161105b565b5050505092915050565b600082601f8301126110a2578081fd5b81516110b0611046826118cb565b8181529150602080830190840160005b83811015611088576110d8876020845189010161113a565b835260209283019291909101906001016110c0565b600082601f8301126110fd578081fd5b815161110b611046826118eb565b915080825283602082850101111561112257600080fd5b611133816020840160208601611918565b5092915050565b60006101c080838503121561114d578182fd5b611156816118a4565b9150506111638383611004565b81526111728360208401611004565b60208201526111848360408401611004565b60408201526111968360608401611004565b60608201526080820151608082015260a082015160a082015260c082015160c082015260e082015160e08201526101008083015181830152506101208083015181830152506101408083015167ffffffffffffffff808211156111f857600080fd5b611204868387016110ed565b8385015261016092508285015191508082111561122057600080fd5b61122c868387016110ed565b8385015261018092508285015191508082111561124857600080fd5b611254868387016110ed565b838501526101a092508285015191508082111561127057600080fd5b5061127d858286016110ed565b82840152505092915050565b60006020828403121561129a578081fd5b815167ffffffffffffffff8111156112b0578182fd5b6112bc84828501611092565b949350505050565b6000806000606084860312156112d8578182fd5b835167ffffffffffffffff808211156112ef578384fd5b6112fb87838801611092565b9450602091508186015181811115611311578485fd5b80870188601f820112611322578586fd5b80519150611332611046836118cb565b82815284810190828601868502840187018c101561134e578889fd5b8893505b84841015611370578051835260019390930192918601918601611352565b5060408a015190975094505050508082111561138a578283fd5b5061139786828701611028565b9150509250925092565b6000806000606084860312156113b5578283fd5b835167ffffffffffffffff808211156113cc578485fd5b6113d887838801611092565b945060208601519350604086015191508082111561138a578283fd5b600060208284031215611405578081fd5b813567ffffffffffffffff81111561141b578182fd5b80830184601f82011261142c578283fd5b8035915061143c611046836118eb565b828152856020848401011115611450578384fd5b82602083016020830137918201602001929092529392505050565b60006020828403121561147c578081fd5b815167ffffffffffffffff811115611492578182fd5b6112bc8482850161113a565b600080600080608085870312156114b3578081fd5b845167ffffffffffffffff808211156114ca578283fd5b6114d68883890161113a565b955060208701519150808211156114eb578283fd5b6114f78883890161113a565b9450604087015191508082111561150c578283fd5b611518888389016110ed565b9350606087015191508082111561152d578283fd5b5061153a878288016110ed565b91505092959194509250565b60008060006060848603121561155a578283fd5b835167ffffffffffffffff80821115611571578485fd5b61157d8783880161113a565b9450602086015193506040860151915080821115611599578283fd5b50611397868287016110ed565b60006101c06115b68484516116af565b60208301516115c860208601826116af565b5060408301516115db60408601826116af565b5060608301516115ee60608601826116af565b506080830151608085015260a083015160a085015260c083015160c085015260e083015160e085015261010080840151818601525061012080840151818601525061014080840151828287015261164783870182611720565b915050610160915081840151858203838701526116648282611720565b9250505061018080840151858303828701526116808382611720565b9150506101a09150818401518582038387015261169d8282611720565b9695505050505050565b815260200190565b73ffffffffffffffffffffffffffffffffffffffff169052565b600081518084526020840180819550602083028101915060208501845b848110156117145782840388526116fe848351611720565b60209889019890945091909101906001016116e6565b50919695505050505050565b60008151808452611738816020860160208601611918565b601f01601f19169290920160200192915050565b606081016008851061175a57fe5b938152602081019290925260409091015290565b6000608082526117816080830187611720565b602083820381850152818751611797818561190f565b91508193508281028201838a01865b838110156117d05786830385526117be8383516115a6565b948601949250908501906001016117a6565b50508681036040880152809450885192506117eb838261190f565b94505050818701845b82811015611815576118078583516116a7565b9450908301906001016117f4565b50505050828103606084015261182b81856116c9565b979650505050505050565b60208082526019908201527f554e4b4e4f574e5f46554e4354494f4e5f53454c4543544f5200000000000000604082015260600190565b6020808252600d908201527f554e494d504c454d454e54454400000000000000000000000000000000000000604082015260600190565b60405181810167ffffffffffffffff811182821017156118c357600080fd5b604052919050565b600067ffffffffffffffff8211156118e1578081fd5b5060209081020190565b600067ffffffffffffffff821115611901578081fd5b50601f01601f191660200190565b90815260200190565b60005b8381101561193357818101518382015260200161191b565b83811115611942576000848401525b5050505056fea365627a7a72315820884abdfe69fd82b726a34318b3e10d0da6e8c516e328d10258429ee105f0ad396c6578706572696d656e74616cf564736f6c63430005100040';
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
