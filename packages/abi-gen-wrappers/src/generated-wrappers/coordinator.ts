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
export class CoordinatorContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode =
        '0x6080604052600436106100b15760003560e01c8063da4fe07411610069578063ee55b9681161004e578063ee55b9681461018a578063fb6961cc146101b7578063fdd059a5146101cc576100b1565b8063da4fe07414610162578063e1c7157814610175576100b1565b806389fab5b71161009a57806389fab5b714610109578063b2562b7a1461012b578063c26cfecd14610140576100b1565b80630f7d8e39146100b357806352813679146100e9575b005b3480156100bf57600080fd5b506100d36100ce3660046116c2565b6101ec565b6040516100e09190611a15565b60405180910390f35b3480156100f557600080fd5b506100b1610104366004611889565b610455565b34801561011557600080fd5b5061011e610482565b6040516100e09190611c41565b34801561013757600080fd5b5061011e6104bb565b34801561014c57600080fd5b506101556104f4565b6040516100e09190611ba2565b6100b1610170366004611889565b6104fa565b34801561018157600080fd5b506101556105e8565b34801561019657600080fd5b506101aa6101a5366004611707565b61060c565b6040516100e09190611a36565b3480156101c357600080fd5b50610155610ac0565b3480156101d857600080fd5b506101556101e7366004611775565b610ac6565b80516000908061020a5761020a61020560008686610ad9565b610b7e565b60008360018551038151811061021c57fe5b016020015160f81c90506008811061023d5761023d61020560018787610ad9565b60008160ff16600881111561024e57fe5b9050600081600881111561025e57fe5b14156102785761027361020560028888610ad9565b61043c565b600181600881111561028657fe5b141561029b5761027361020560038888610ad9565b60028160088111156102a957fe5b141561038557826042146102c6576102c661020560008888610ad9565b6000856000815181106102d557fe5b016020015160f81c905060006102f287600163ffffffff610b8616565b9050600061030788602163ffffffff610b8616565b90506001898484846040516000815260200160405260405161032c9493929190611bcf565b6020604051602081039080840390855afa15801561034e573d6000803e3d6000fd5b50506040517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe00151975061044f9650505050505050565b600381600881111561039357fe5b141561043c57826042146103b0576103b061020560008888610ad9565b6000856000815181106103bf57fe5b016020015160f81c905060006103dc87600163ffffffff610b8616565b905060006103f188602163ffffffff610b8616565b905060018960405160200161040691906119e4565b604051602081830303815290604052805190602001208484846040516000815260200160405260405161032c9493929190611bcf565b61044b61020560018888610ad9565b5050505b92915050565b6060610464856080015161060c565b80519091501561047b5761047b8582868686610bb0565b5050505050565b6040518060400160405280601781526020017f30782050726f746f636f6c20436f6f7264696e61746f7200000000000000000081525081565b6040518060400160405280600581526020017f332e302e3000000000000000000000000000000000000000000000000000000081525081565b60015481565b61050684848484610455565b6002546040517f2280c9100000000000000000000000000000000000000000000000000000000081526201000090910473ffffffffffffffffffffffffffffffffffffffff1690632280c9109034906105659088908790600401611c54565b6000604051808303818588803b15801561057e57600080fd5b505af1158015610592573d6000803e3d6000fd5b50505050506040513d6000823e601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682016040526105d99190810190611742565b506105e2610d5d565b50505050565b7fa6511c04ca44625d50986f8c36bedc09366207a17b96e347094053a9f850716881565b60606000610620838263ffffffff610d7316565b90507fffffffff0000000000000000000000000000000000000000000000000000000081167f9b44d5560000000000000000000000000000000000000000000000000000000014806106b357507fffffffff0000000000000000000000000000000000000000000000000000000081167fe14b58c400000000000000000000000000000000000000000000000000000000145b1561073c576106c06112e6565b83516106d690859060049063ffffffff610dbf16565b8060200190516106e991908101906117ff565b604080516001808252818301909252919250816020015b6107086112e6565b815260200190600190039081610700579050509250808360008151811061072b57fe5b602002602001018190525050610aba565b7fffffffff0000000000000000000000000000000000000000000000000000000081167f9694a4020000000000000000000000000000000000000000000000000000000014806107cd57507fffffffff0000000000000000000000000000000000000000000000000000000081167f8ea8dfe400000000000000000000000000000000000000000000000000000000145b8061081957507fffffffff0000000000000000000000000000000000000000000000000000000081167fbeee2e1400000000000000000000000000000000000000000000000000000000145b8061086557507fffffffff0000000000000000000000000000000000000000000000000000000081167f78d29ac100000000000000000000000000000000000000000000000000000000145b806108b157507fffffffff0000000000000000000000000000000000000000000000000000000081167f8bc8efb300000000000000000000000000000000000000000000000000000000145b806108fd57507fffffffff0000000000000000000000000000000000000000000000000000000081167f369da09900000000000000000000000000000000000000000000000000000000145b8061094957507fffffffff0000000000000000000000000000000000000000000000000000000081167fa6c3bf3300000000000000000000000000000000000000000000000000000000145b1561097e57825161096490849060049063ffffffff610dbf16565b8060200190516109779190810190611636565b9150610aba565b7fffffffff0000000000000000000000000000000000000000000000000000000081167f88ec79fb000000000000000000000000000000000000000000000000000000001480610a0f57507fffffffff0000000000000000000000000000000000000000000000000000000081167fb718e29200000000000000000000000000000000000000000000000000000000145b15610aba57610a1c6112e6565b610a246112e6565b8451610a3a90869060049063ffffffff610dbf16565b806020019051610a4d9190810190611832565b60408051600280825260608201909252929450909250816020015b610a706112e6565b815260200190600190039081610a685790505093508184600081518110610a9357fe5b60200260200101819052508084600181518110610aac57fe5b602002602001018190525050505b50919050565b60005481565b600061044f610ad483610e46565b610e99565b606063779c522360e01b848484604051602401610af893929190611c0f565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff000000000000000000000000000000000000000000000000000000009093169290921790915290509392505050565b805160208201fd5b60008160200183511015610ba757610ba76102056005855185602001610ea7565b50016020015190565b3273ffffffffffffffffffffffffffffffffffffffff841614610bd957610bd961020584610ec6565b6000610be786600154610f65565b60408051600080825260208201909252845192935091905b818114610c9057610c0e6113ad565b60405180606001604052808973ffffffffffffffffffffffffffffffffffffffff1681526020018681526020018881525090506000610c4c82610ac6565b90506000610c6d82898681518110610c6057fe5b60200260200101516101ec565b9050610c7f868263ffffffff610f7916565b95505060019092019150610bff9050565b50610ca1823263ffffffff610f7916565b875190925060005b818114610d5157600073ffffffffffffffffffffffffffffffffffffffff16898281518110610cd457fe5b60200260200101516060015173ffffffffffffffffffffffffffffffffffffffff161415610d0157610d49565b6000898281518110610d0f57fe5b60200260200101516040015190506000610d32828761101b90919063ffffffff16565b905080610d4657610d466102058884611053565b50505b600101610ca9565b50505050505050505050565b610d656110f5565b610d7157610d71611103565b565b60008160040183511015610d9457610d946102056003855185600401610ea7565b5001602001517fffffffff000000000000000000000000000000000000000000000000000000001690565b606081831115610dd857610dd861020560008585610ea7565b8351821115610df157610df16102056001848751610ea7565b8282036040519080825280601f01601f191660200182016040528015610e1e576020820181803883390190505b509050610e3f610e2d8261113d565b84610e378761113d565b018351611143565b9392505050565b604081810151825160209384015182519285019290922083517fa6511c04ca44625d50986f8c36bedc09366207a17b96e347094053a9f85071688152948501919091529183015260608201526080902090565b600061044f60005483611207565b6060632800659560e01b848484604051602401610af893929190611bed565b606063a458d7ff60e01b82604051602401610ee19190611a15565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff00000000000000000000000000000000000000000000000000000000909316929092179091529050919050565b6000610e3f82610f7485611241565b611207565b815160405160609184906020808202808401820192910182851015610fa557610fa561020586856112c9565b82851115610fbf57610fb8858583611143565b8497508793505b60018201915060208101905080840192508294508188528460405286886001840381518110610fea57fe5b73ffffffffffffffffffffffffffffffffffffffff9092166020928302919091019091015250959695505050505050565b60006020835102602084018181018192505b8083101561044b5782518086141561104757600194508193505b5060208301925061102d565b606063d789b64060e01b8383604051602401611070929190611bab565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff0000000000000000000000000000000000000000000000000000000090931692909217909152905092915050565b600254610100900460ff1690565b3031801561113a57604051339082156108fc029083906000818181858888f19350505050158015611138573d6000803e3d6000fd5b505b50565b60200190565b602081101561116d576001816020036101000a038019835116818551168082178652505050611202565b8282141561117a57611202565b828211156111b45760208103905080820181840181515b828510156111ac578451865260209586019590940193611191565b905250611202565b60208103905080820181840183515b818612156111fd57825182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe092830192909101906111c3565b855250505b505050565b6040517f19010000000000000000000000000000000000000000000000000000000000008152600281019290925260228201526042902090565b608081810151825160208085015160408087015160609788015186519685019690962082517fec69816980a3a3ca4554410e60253953e9ff375ba4536a98adfa15cc71541508815294850195909552908301919091529481019490945273ffffffffffffffffffffffffffffffffffffffff9091169183019190915260a082015260c0902090565b6060635fc8372260e01b8383604051602401611070929190611cca565b604051806101c00160405280600073ffffffffffffffffffffffffffffffffffffffff168152602001600073ffffffffffffffffffffffffffffffffffffffff168152602001600073ffffffffffffffffffffffffffffffffffffffff168152602001600073ffffffffffffffffffffffffffffffffffffffff168152602001600081526020016000815260200160008152602001600081526020016000815260200160008152602001606081526020016060815260200160608152602001606081525090565b6040805160608082018352600080835260208301529181019190915290565b803561044f81611d8d565b805161044f81611d8d565b600082601f8301126113f2578081fd5b813561140561140082611cff565b611cd8565b8181529150602080830190840160005b838110156114425761142d876020843589010161144c565b83526020928301929190910190600101611415565b5050505092915050565b600082601f83011261145c578081fd5b813561146a61140082611d1f565b915080825283602082850101111561148157600080fd5b8060208401602084013760009082016020015292915050565b600082601f8301126114aa578081fd5b81516114b861140082611d1f565b91508082528360208285010111156114cf57600080fd5b6114e0816020840160208601611d61565b5092915050565b60006101c08083850312156114fa578182fd5b61150381611cd8565b91505061151083836113d7565b815261151f83602084016113d7565b602082015261153183604084016113d7565b604082015261154383606084016113d7565b60608201526080820151608082015260a082015160a082015260c082015160c082015260e082015160e08201526101008083015181830152506101208083015181830152506101408083015167ffffffffffffffff808211156115a557600080fd5b6115b18683870161149a565b838501526101609250828501519150808211156115cd57600080fd5b6115d98683870161149a565b838501526101809250828501519150808211156115f557600080fd5b6116018683870161149a565b838501526101a092508285015191508082111561161d57600080fd5b5061162a8582860161149a565b82840152505092915050565b60006020808385031215611648578182fd5b825167ffffffffffffffff81111561165e578283fd5b80840185601f82011261166f578384fd5b8051915061167f61140083611cff565b82815283810190828501865b858110156116b4576116a28a8884518801016114e7565b8452928601929086019060010161168b565b509098975050505050505050565b600080604083850312156116d4578081fd5b82359150602083013567ffffffffffffffff8111156116f1578182fd5b6116fd8582860161144c565b9150509250929050565b600060208284031215611718578081fd5b813567ffffffffffffffff81111561172e578182fd5b61173a8482850161144c565b949350505050565b600060208284031215611753578081fd5b815167ffffffffffffffff811115611769578182fd5b61173a8482850161149a565b600060208284031215611786578081fd5b813567ffffffffffffffff8082111561179d578283fd5b818401606081870312156117af578384fd5b6117b96060611cd8565b925080356117c681611d8d565b8352602081810135908401526040810135828111156117e3578485fd5b6117ef8782840161144c565b6040850152509195945050505050565b600060208284031215611810578081fd5b815167ffffffffffffffff811115611826578182fd5b61173a848285016114e7565b60008060408385031215611844578182fd5b825167ffffffffffffffff8082111561185b578384fd5b611867868387016114e7565b9350602085015191508082111561187c578283fd5b506116fd858286016114e7565b6000806000806080858703121561189e578182fd5b843567ffffffffffffffff808211156118b5578384fd5b81870160a0818a0312156118c7578485fd5b6118d160a0611cd8565b92508035835260208101356020840152604081013560408401526118f889606083016113cc565b606084015260808101358281111561190e578586fd5b61191a8a82840161144c565b6080850152505081955061193188602089016113cc565b94506040870135915080821115611946578384fd5b6119528883890161144c565b93506060870135915080821115611967578283fd5b50611974878288016113e2565b91505092959194509250565b73ffffffffffffffffffffffffffffffffffffffff169052565b600081518084526119b2816020860160208601611d61565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b7f19457468657265756d205369676e6564204d6573736167653a0a3332000000008152601c810191909152603c0190565b73ffffffffffffffffffffffffffffffffffffffff91909116815260200190565b6000602080830181845280855180835260408601915060408482028701019250838701855b82811015611b95577fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc088860301845281516101c0611a9a878351611980565b87820151611aaa89890182611980565b506040820151611abd6040890182611980565b506060820151611ad06060890182611980565b506080820151608088015260a082015160a088015260c082015160c088015260e082015160e08801526101008083015181890152506101208083015181890152506101408083015182828a0152611b29838a018261199a565b915050610160915081830151888203838a0152611b46828261199a565b9250505061018080830151888303828a0152611b62838261199a565b9150506101a0915081830151888203838a0152611b7f828261199a565b9850505094870194505090850190600101611a5b565b5092979650505050505050565b90815260200190565b91825273ffffffffffffffffffffffffffffffffffffffff16602082015260400190565b93845260ff9290921660208401526040830152606082015260800190565b6060810160088510611bfb57fe5b938152602081019290925260409091015290565b600060048510611c1b57fe5b84825283602083015260606040830152611c38606083018461199a565b95945050505050565b600060208252610e3f602083018461199a565b60006040825283516040830152602084015160608301526040840151608083015273ffffffffffffffffffffffffffffffffffffffff60608501511660a0830152608084015160a060c0840152611cae60e084018261199a565b8381036020850152611cc0818661199a565b9695505050505050565b918252602082015260400190565b60405181810167ffffffffffffffff81118282101715611cf757600080fd5b604052919050565b600067ffffffffffffffff821115611d15578081fd5b5060209081020190565b600067ffffffffffffffff821115611d35578081fd5b50601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01660200190565b60005b83811015611d7c578181015183820152602001611d64565b838111156105e25750506000910152565b73ffffffffffffffffffffffffffffffffffffffff8116811461113a57600080fd5b8351602094850120835193850193909320604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f815295860194909452928401929092526060830152608082015260a090209056fea365627a7a72315820efc81773b7912bf9e2c93c985afa2b6feee69452023986811fc84107b08ecc776c6578706572696d656e74616cf564736f6c634300050d0040';
    private readonly _methodABIIndex: { [name: string]: number } = {};
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
        exchange: string,
        chainId: BigNumber,
    ): Promise<CoordinatorContract> {
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
        return CoordinatorContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
            exchange,
            chainId,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
        exchange: string,
        chainId: BigNumber,
    ): Promise<CoordinatorContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [exchange, chainId] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [exchange, chainId],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [exchange, chainId]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`Coordinator successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new CoordinatorContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [exchange, chainId];
        return contractInstance;
    }

    /**
     * @returns      The contract ABI
     */
    public static ABI(): ContractAbi {
        const abi = [
            {
                inputs: [
                    {
                        name: 'exchange',
                        type: 'address',
                    },
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
                inputs: [],
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'fallback',
            },
            {
                constant: true,
                inputs: [],
                name: 'EIP712_COORDINATOR_APPROVAL_SCHEMA_HASH',
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
                name: 'EIP712_COORDINATOR_DOMAIN_HASH',
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
                name: 'EIP712_COORDINATOR_DOMAIN_NAME',
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
                name: 'EIP712_COORDINATOR_DOMAIN_VERSION',
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
                        name: 'txOrigin',
                        type: 'address',
                    },
                    {
                        name: 'transactionSignature',
                        type: 'bytes',
                    },
                    {
                        name: 'approvalSignatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'assertValidCoordinatorApprovals',
                outputs: [],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'data',
                        type: 'bytes',
                    },
                ],
                name: 'decodeOrdersFromFillData',
                outputs: [
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
                payable: false,
                stateMutability: 'pure',
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
                        name: 'txOrigin',
                        type: 'address',
                    },
                    {
                        name: 'transactionSignature',
                        type: 'bytes',
                    },
                    {
                        name: 'approvalSignatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'executeTransaction',
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'approval',
                        type: 'tuple',
                        components: [
                            {
                                name: 'txOrigin',
                                type: 'address',
                            },
                            {
                                name: 'transactionHash',
                                type: 'bytes32',
                            },
                            {
                                name: 'transactionSignature',
                                type: 'bytes',
                            },
                        ],
                    },
                ],
                name: 'getCoordinatorApprovalHash',
                outputs: [
                    {
                        name: 'approvalHash',
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
                        name: 'hash',
                        type: 'bytes32',
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'getSignerAddress',
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
        ] as ContractAbi;
        return abi;
    }

    public getFunctionSignature(methodName: string): string {
        const index = this._methodABIIndex[methodName];
        const methodAbi = CoordinatorContract.ABI()[index] as MethodAbi; // tslint:disable-line:no-unnecessary-type-assertion
        const functionSignature = methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    }
    public getABIDecodedTransactionData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as CoordinatorContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecode<T>(callData);
        return abiDecodedCallData;
    }
    public getABIDecodedReturnData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as CoordinatorContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecodeReturnValue<T>(callData);
        return abiDecodedCallData;
    }
    public getSelector(methodName: string): string {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as CoordinatorContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    }

    public EIP712_COORDINATOR_APPROVAL_SCHEMA_HASH(): ContractFunctionObj<string> {
        const self = (this as any) as CoordinatorContract;

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
                const encodedData = self._strictEncodeArguments('EIP712_COORDINATOR_APPROVAL_SCHEMA_HASH()', []);
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
                const abiEncoder = self._lookupAbiEncoder('EIP712_COORDINATOR_APPROVAL_SCHEMA_HASH()');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments(
                    'EIP712_COORDINATOR_APPROVAL_SCHEMA_HASH()',
                    [],
                );
                return abiEncodedTransactionData;
            },
        };
    }
    public EIP712_COORDINATOR_DOMAIN_HASH(): ContractFunctionObj<string> {
        const self = (this as any) as CoordinatorContract;

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
                const encodedData = self._strictEncodeArguments('EIP712_COORDINATOR_DOMAIN_HASH()', []);
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
                const abiEncoder = self._lookupAbiEncoder('EIP712_COORDINATOR_DOMAIN_HASH()');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('EIP712_COORDINATOR_DOMAIN_HASH()', []);
                return abiEncodedTransactionData;
            },
        };
    }
    public EIP712_COORDINATOR_DOMAIN_NAME(): ContractFunctionObj<string> {
        const self = (this as any) as CoordinatorContract;

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
                const encodedData = self._strictEncodeArguments('EIP712_COORDINATOR_DOMAIN_NAME()', []);
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
                const abiEncoder = self._lookupAbiEncoder('EIP712_COORDINATOR_DOMAIN_NAME()');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('EIP712_COORDINATOR_DOMAIN_NAME()', []);
                return abiEncodedTransactionData;
            },
        };
    }
    public EIP712_COORDINATOR_DOMAIN_VERSION(): ContractFunctionObj<string> {
        const self = (this as any) as CoordinatorContract;

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
                const encodedData = self._strictEncodeArguments('EIP712_COORDINATOR_DOMAIN_VERSION()', []);
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
                const abiEncoder = self._lookupAbiEncoder('EIP712_COORDINATOR_DOMAIN_VERSION()');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments(
                    'EIP712_COORDINATOR_DOMAIN_VERSION()',
                    [],
                );
                return abiEncodedTransactionData;
            },
        };
    }
    public EIP712_EXCHANGE_DOMAIN_HASH(): ContractFunctionObj<string> {
        const self = (this as any) as CoordinatorContract;

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
                const encodedData = self._strictEncodeArguments('EIP712_EXCHANGE_DOMAIN_HASH()', []);
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
                const abiEncoder = self._lookupAbiEncoder('EIP712_EXCHANGE_DOMAIN_HASH()');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('EIP712_EXCHANGE_DOMAIN_HASH()', []);
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Validates that the 0x transaction has been approved by all of the feeRecipients
     * that correspond to each order in the transaction's Exchange calldata.
     * @param transaction 0x transaction containing salt, signerAddress, and data.
     * @param txOrigin Required signer of Ethereum transaction calling this
     *     function.
     * @param transactionSignature Proof that the transaction has been signed by
     *     the signer.
     * @param approvalSignatures Array of signatures that correspond to the
     *     feeRecipients of each        order in the transaction's Exchange
     *     calldata.
     */
    public assertValidCoordinatorApprovals(
        transaction: {
            salt: BigNumber;
            expirationTimeSeconds: BigNumber;
            gasPrice: BigNumber;
            signerAddress: string;
            data: string;
        },
        txOrigin: string,
        transactionSignature: string,
        approvalSignatures: string[],
    ): ContractFunctionObj<void> {
        const self = (this as any) as CoordinatorContract;

        assert.isString('txOrigin', txOrigin);
        assert.isString('transactionSignature', transactionSignature);
        assert.isArray('approvalSignatures', approvalSignatures);

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments(
                    'assertValidCoordinatorApprovals((uint256,uint256,uint256,address,bytes),address,bytes,bytes[])',
                    [transaction, txOrigin.toLowerCase(), transactionSignature, approvalSignatures],
                );
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
                const abiEncoder = self._lookupAbiEncoder(
                    'assertValidCoordinatorApprovals((uint256,uint256,uint256,address,bytes),address,bytes,bytes[])',
                );
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments(
                    'assertValidCoordinatorApprovals((uint256,uint256,uint256,address,bytes),address,bytes,bytes[])',
                    [transaction, txOrigin.toLowerCase(), transactionSignature, approvalSignatures],
                );
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Decodes the orders from Exchange calldata representing any fill method.
     * @param data Exchange calldata representing a fill method.
     * @returns orders The orders from the Exchange calldata.
     */
    public decodeOrdersFromFillData(
        data: string,
    ): ContractFunctionObj<
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
        }>
    > {
        const self = (this as any) as CoordinatorContract;
        assert.isString('data', data);

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<
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
                }>
            > {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('decodeOrdersFromFillData(bytes)', [data]);
                let rawCallResult;

                const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');
                try {
                    rawCallResult = await self._evmExecAsync(encodedDataBytes);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('decodeOrdersFromFillData(bytes)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<
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
                    }>
                >(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('decodeOrdersFromFillData(bytes)', [
                    data,
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Executes a 0x transaction that has been signed by the feeRecipients that correspond to
     * each order in the transaction's Exchange calldata.
     * @param transaction 0x transaction containing salt, signerAddress, and data.
     * @param txOrigin Required signer of Ethereum transaction calling this
     *     function.
     * @param transactionSignature Proof that the transaction has been signed by
     *     the signer.
     * @param approvalSignatures Array of signatures that correspond to the
     *     feeRecipients of each        order in the transaction's Exchange
     *     calldata.
     */
    public executeTransaction(
        transaction: {
            salt: BigNumber;
            expirationTimeSeconds: BigNumber;
            gasPrice: BigNumber;
            signerAddress: string;
            data: string;
        },
        txOrigin: string,
        transactionSignature: string,
        approvalSignatures: string[],
    ): ContractTxFunctionObj<void> {
        const self = (this as any) as CoordinatorContract;

        assert.isString('txOrigin', txOrigin);
        assert.isString('transactionSignature', transactionSignature);
        assert.isArray('approvalSignatures', approvalSignatures);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments(
                    'executeTransaction((uint256,uint256,uint256,address,bytes),address,bytes,bytes[])',
                    [transaction, txOrigin.toLowerCase(), transactionSignature, approvalSignatures],
                );
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
                const encodedData = self._strictEncodeArguments(
                    'executeTransaction((uint256,uint256,uint256,address,bytes),address,bytes,bytes[])',
                    [transaction, txOrigin.toLowerCase(), transactionSignature, approvalSignatures],
                );
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
                const encodedData = self._strictEncodeArguments(
                    'executeTransaction((uint256,uint256,uint256,address,bytes),address,bytes,bytes[])',
                    [transaction, txOrigin.toLowerCase(), transactionSignature, approvalSignatures],
                );
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
                const abiEncoder = self._lookupAbiEncoder(
                    'executeTransaction((uint256,uint256,uint256,address,bytes),address,bytes,bytes[])',
                );
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments(
                    'executeTransaction((uint256,uint256,uint256,address,bytes),address,bytes,bytes[])',
                    [transaction, txOrigin.toLowerCase(), transactionSignature, approvalSignatures],
                );
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Calculates the EIP712 hash of the Coordinator approval mesasage using the domain
     * separator of this contract.
     * @param approval Coordinator approval message containing the transaction
     *     hash, and transaction        signature.
     * @returns approvalHash EIP712 hash of the Coordinator approval message with the domain         separator of this contract.
     */
    public getCoordinatorApprovalHash(approval: {
        txOrigin: string;
        transactionHash: string;
        transactionSignature: string;
    }): ContractFunctionObj<string> {
        const self = (this as any) as CoordinatorContract;

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
                const encodedData = self._strictEncodeArguments('getCoordinatorApprovalHash((address,bytes32,bytes))', [
                    approval,
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
                const abiEncoder = self._lookupAbiEncoder('getCoordinatorApprovalHash((address,bytes32,bytes))');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments(
                    'getCoordinatorApprovalHash((address,bytes32,bytes))',
                    [approval],
                );
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Recovers the address of a signer given a hash and signature.
     * @param hash Any 32 byte hash.
     * @param signature Proof that the hash has been signed by signer.
     * @returns signerAddress Address of the signer.
     */
    public getSignerAddress(hash: string, signature: string): ContractFunctionObj<string> {
        const self = (this as any) as CoordinatorContract;
        assert.isString('hash', hash);
        assert.isString('signature', signature);

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
                const encodedData = self._strictEncodeArguments('getSignerAddress(bytes32,bytes)', [hash, signature]);
                let rawCallResult;

                const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');
                try {
                    rawCallResult = await self._evmExecAsync(encodedDataBytes);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('getSignerAddress(bytes32,bytes)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('getSignerAddress(bytes32,bytes)', [
                    hash,
                    signature,
                ]);
                return abiEncodedTransactionData;
            },
        };
    }

    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = CoordinatorContract.deployedBytecode,
    ) {
        super(
            'Coordinator',
            CoordinatorContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        CoordinatorContract.ABI().forEach((item, index) => {
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
