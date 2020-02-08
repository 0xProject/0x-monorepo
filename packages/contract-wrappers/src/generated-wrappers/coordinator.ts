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
    linkLibrariesInBytecode,
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
import { BigNumber, classUtils, hexUtils, logUtils, providerUtils } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

/* istanbul ignore next */
// tslint:disable:array-type
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class CoordinatorContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode =
        '0x6080604052600436106100b15760003560e01c8063da4fe07411610069578063ee55b9681161004e578063ee55b9681461018a578063fb6961cc146101b7578063fdd059a5146101cc576100b1565b8063da4fe07414610162578063e1c7157814610175576100b1565b806389fab5b71161009a57806389fab5b714610109578063b2562b7a1461012b578063c26cfecd14610140576100b1565b80630f7d8e39146100b357806352813679146100e9575b005b3480156100bf57600080fd5b506100d36100ce3660046116c1565b6101ec565b6040516100e09190611a14565b60405180910390f35b3480156100f557600080fd5b506100b1610104366004611888565b610455565b34801561011557600080fd5b5061011e610482565b6040516100e09190611c40565b34801561013757600080fd5b5061011e6104bb565b34801561014c57600080fd5b506101556104f4565b6040516100e09190611ba1565b6100b1610170366004611888565b6104fa565b34801561018157600080fd5b506101556105e8565b34801561019657600080fd5b506101aa6101a5366004611706565b61060c565b6040516100e09190611a35565b3480156101c357600080fd5b50610155610ac0565b3480156101d857600080fd5b506101556101e7366004611774565b610ac6565b80516000908061020a5761020a61020560008686610ad9565b610b7e565b60008360018551038151811061021c57fe5b016020015160f81c90506008811061023d5761023d61020560018787610ad9565b60008160ff16600881111561024e57fe5b9050600081600881111561025e57fe5b14156102785761027361020560028888610ad9565b61043c565b600181600881111561028657fe5b141561029b5761027361020560038888610ad9565b60028160088111156102a957fe5b141561038557826042146102c6576102c661020560008888610ad9565b6000856000815181106102d557fe5b016020015160f81c905060006102f287600163ffffffff610b8616565b9050600061030788602163ffffffff610b8616565b90506001898484846040516000815260200160405260405161032c9493929190611bce565b6020604051602081039080840390855afa15801561034e573d6000803e3d6000fd5b50506040517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe00151975061044f9650505050505050565b600381600881111561039357fe5b141561043c57826042146103b0576103b061020560008888610ad9565b6000856000815181106103bf57fe5b016020015160f81c905060006103dc87600163ffffffff610b8616565b905060006103f188602163ffffffff610b8616565b905060018960405160200161040691906119e3565b604051602081830303815290604052805190602001208484846040516000815260200160405260405161032c9493929190611bce565b61044b61020560018888610ad9565b5050505b92915050565b6060610464856080015161060c565b80519091501561047b5761047b8582868686610bb0565b5050505050565b6040518060400160405280601781526020017f30782050726f746f636f6c20436f6f7264696e61746f7200000000000000000081525081565b6040518060400160405280600581526020017f332e302e3000000000000000000000000000000000000000000000000000000081525081565b60015481565b61050684848484610455565b6002546040517f2280c9100000000000000000000000000000000000000000000000000000000081526201000090910473ffffffffffffffffffffffffffffffffffffffff1690632280c9109034906105659088908790600401611c53565b6000604051808303818588803b15801561057e57600080fd5b505af1158015610592573d6000803e3d6000fd5b50505050506040513d6000823e601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682016040526105d99190810190611741565b506105e2610d5d565b50505050565b7fa6511c04ca44625d50986f8c36bedc09366207a17b96e347094053a9f850716881565b60606000610620838263ffffffff610d7316565b90507fffffffff0000000000000000000000000000000000000000000000000000000081167f9b44d5560000000000000000000000000000000000000000000000000000000014806106b357507fffffffff0000000000000000000000000000000000000000000000000000000081167fe14b58c400000000000000000000000000000000000000000000000000000000145b1561073c576106c06112e5565b83516106d690859060049063ffffffff610dbf16565b8060200190516106e991908101906117fe565b604080516001808252818301909252919250816020015b6107086112e5565b815260200190600190039081610700579050509250808360008151811061072b57fe5b602002602001018190525050610aba565b7fffffffff0000000000000000000000000000000000000000000000000000000081167f9694a4020000000000000000000000000000000000000000000000000000000014806107cd57507fffffffff0000000000000000000000000000000000000000000000000000000081167f8ea8dfe400000000000000000000000000000000000000000000000000000000145b8061081957507fffffffff0000000000000000000000000000000000000000000000000000000081167fbeee2e1400000000000000000000000000000000000000000000000000000000145b8061086557507fffffffff0000000000000000000000000000000000000000000000000000000081167f78d29ac100000000000000000000000000000000000000000000000000000000145b806108b157507fffffffff0000000000000000000000000000000000000000000000000000000081167f8bc8efb300000000000000000000000000000000000000000000000000000000145b806108fd57507fffffffff0000000000000000000000000000000000000000000000000000000081167f369da09900000000000000000000000000000000000000000000000000000000145b8061094957507fffffffff0000000000000000000000000000000000000000000000000000000081167fa6c3bf3300000000000000000000000000000000000000000000000000000000145b1561097e57825161096490849060049063ffffffff610dbf16565b8060200190516109779190810190611635565b9150610aba565b7fffffffff0000000000000000000000000000000000000000000000000000000081167f88ec79fb000000000000000000000000000000000000000000000000000000001480610a0f57507fffffffff0000000000000000000000000000000000000000000000000000000081167fb718e29200000000000000000000000000000000000000000000000000000000145b15610aba57610a1c6112e5565b610a246112e5565b8451610a3a90869060049063ffffffff610dbf16565b806020019051610a4d9190810190611831565b60408051600280825260608201909252929450909250816020015b610a706112e5565b815260200190600190039081610a685790505093508184600081518110610a9357fe5b60200260200101819052508084600181518110610aac57fe5b602002602001018190525050505b50919050565b60005481565b600061044f610ad483610e46565b610e99565b606063779c522360e01b848484604051602401610af893929190611c0e565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff000000000000000000000000000000000000000000000000000000009093169290921790915290509392505050565b805160208201fd5b60008160200183511015610ba757610ba76102056005855185602001610ea7565b50016020015190565b3273ffffffffffffffffffffffffffffffffffffffff841614610bd957610bd961020584610ec6565b6000610be786600154610f65565b60408051600080825260208201909252845192935091905b818114610c9057610c0e6113ac565b60405180606001604052808973ffffffffffffffffffffffffffffffffffffffff1681526020018681526020018881525090506000610c4c82610ac6565b90506000610c6d82898681518110610c6057fe5b60200260200101516101ec565b9050610c7f868263ffffffff610f7916565b95505060019092019150610bff9050565b50610ca1823263ffffffff610f7916565b875190925060005b818114610d5157600073ffffffffffffffffffffffffffffffffffffffff16898281518110610cd457fe5b60200260200101516060015173ffffffffffffffffffffffffffffffffffffffff161415610d0157610d49565b6000898281518110610d0f57fe5b60200260200101516040015190506000610d32828761101b90919063ffffffff16565b905080610d4657610d466102058884611053565b50505b600101610ca9565b50505050505050505050565b610d656110f5565b610d7157610d71611103565b565b60008160040183511015610d9457610d946102056003855185600401610ea7565b5001602001517fffffffff000000000000000000000000000000000000000000000000000000001690565b606081831115610dd857610dd861020560008585610ea7565b8351821115610df157610df16102056001848751610ea7565b8282036040519080825280601f01601f191660200182016040528015610e1e576020820181803883390190505b509050610e3f610e2d8261113c565b84610e378761113c565b018351611142565b9392505050565b604081810151825160209384015182519285019290922083517fa6511c04ca44625d50986f8c36bedc09366207a17b96e347094053a9f85071688152948501919091529183015260608201526080902090565b600061044f60005483611206565b6060632800659560e01b848484604051602401610af893929190611bec565b606063a458d7ff60e01b82604051602401610ee19190611a14565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff00000000000000000000000000000000000000000000000000000000909316929092179091529050919050565b6000610e3f82610f7485611240565b611206565b815160405160609184906020808202808401820192910182851015610fa557610fa561020586856112c8565b82851115610fbf57610fb8858583611142565b8497508793505b60018201915060208101905080840192508294508188528460405286886001840381518110610fea57fe5b73ffffffffffffffffffffffffffffffffffffffff9092166020928302919091019091015250959695505050505050565b60006020835102602084018181018192505b8083101561044b5782518086141561104757600194508193505b5060208301925061102d565b606063d789b64060e01b8383604051602401611070929190611baa565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff0000000000000000000000000000000000000000000000000000000090931692909217909152905092915050565b600254610100900460ff1690565b47801561113957604051339082156108fc029083906000818181858888f19350505050158015611137573d6000803e3d6000fd5b505b50565b60200190565b602081101561116c576001816020036101000a038019835116818551168082178652505050611201565b8282141561117957611201565b828211156111b35760208103905080820181840181515b828510156111ab578451865260209586019590940193611190565b905250611201565b60208103905080820181840183515b818612156111fc57825182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe092830192909101906111c2565b855250505b505050565b6040517f19010000000000000000000000000000000000000000000000000000000000008152600281019290925260228201526042902090565b608081810151825160208085015160408087015160609788015186519685019690962082517fec69816980a3a3ca4554410e60253953e9ff375ba4536a98adfa15cc71541508815294850195909552908301919091529481019490945273ffffffffffffffffffffffffffffffffffffffff9091169183019190915260a082015260c0902090565b6060635fc8372260e01b8383604051602401611070929190611cc9565b604051806101c00160405280600073ffffffffffffffffffffffffffffffffffffffff168152602001600073ffffffffffffffffffffffffffffffffffffffff168152602001600073ffffffffffffffffffffffffffffffffffffffff168152602001600073ffffffffffffffffffffffffffffffffffffffff168152602001600081526020016000815260200160008152602001600081526020016000815260200160008152602001606081526020016060815260200160608152602001606081525090565b6040805160608082018352600080835260208301529181019190915290565b803561044f81611d8c565b805161044f81611d8c565b600082601f8301126113f1578081fd5b81356114046113ff82611cfe565b611cd7565b8181529150602080830190840160005b838110156114415761142c876020843589010161144b565b83526020928301929190910190600101611414565b5050505092915050565b600082601f83011261145b578081fd5b81356114696113ff82611d1e565b915080825283602082850101111561148057600080fd5b8060208401602084013760009082016020015292915050565b600082601f8301126114a9578081fd5b81516114b76113ff82611d1e565b91508082528360208285010111156114ce57600080fd5b6114df816020840160208601611d60565b5092915050565b60006101c08083850312156114f9578182fd5b61150281611cd7565b91505061150f83836113d6565b815261151e83602084016113d6565b602082015261153083604084016113d6565b604082015261154283606084016113d6565b60608201526080820151608082015260a082015160a082015260c082015160c082015260e082015160e08201526101008083015181830152506101208083015181830152506101408083015167ffffffffffffffff808211156115a457600080fd5b6115b086838701611499565b838501526101609250828501519150808211156115cc57600080fd5b6115d886838701611499565b838501526101809250828501519150808211156115f457600080fd5b61160086838701611499565b838501526101a092508285015191508082111561161c57600080fd5b5061162985828601611499565b82840152505092915050565b60006020808385031215611647578182fd5b825167ffffffffffffffff81111561165d578283fd5b80840185601f82011261166e578384fd5b8051915061167e6113ff83611cfe565b82815283810190828501865b858110156116b3576116a18a8884518801016114e6565b8452928601929086019060010161168a565b509098975050505050505050565b600080604083850312156116d3578081fd5b82359150602083013567ffffffffffffffff8111156116f0578182fd5b6116fc8582860161144b565b9150509250929050565b600060208284031215611717578081fd5b813567ffffffffffffffff81111561172d578182fd5b6117398482850161144b565b949350505050565b600060208284031215611752578081fd5b815167ffffffffffffffff811115611768578182fd5b61173984828501611499565b600060208284031215611785578081fd5b813567ffffffffffffffff8082111561179c578283fd5b818401606081870312156117ae578384fd5b6117b86060611cd7565b925080356117c581611d8c565b8352602081810135908401526040810135828111156117e2578485fd5b6117ee8782840161144b565b6040850152509195945050505050565b60006020828403121561180f578081fd5b815167ffffffffffffffff811115611825578182fd5b611739848285016114e6565b60008060408385031215611843578182fd5b825167ffffffffffffffff8082111561185a578384fd5b611866868387016114e6565b9350602085015191508082111561187b578283fd5b506116fc858286016114e6565b6000806000806080858703121561189d578182fd5b843567ffffffffffffffff808211156118b4578384fd5b81870160a0818a0312156118c6578485fd5b6118d060a0611cd7565b92508035835260208101356020840152604081013560408401526118f789606083016113cb565b606084015260808101358281111561190d578586fd5b6119198a82840161144b565b6080850152505081955061193088602089016113cb565b94506040870135915080821115611945578384fd5b6119518883890161144b565b93506060870135915080821115611966578283fd5b50611973878288016113e1565b91505092959194509250565b73ffffffffffffffffffffffffffffffffffffffff169052565b600081518084526119b1816020860160208601611d60565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b7f19457468657265756d205369676e6564204d6573736167653a0a3332000000008152601c810191909152603c0190565b73ffffffffffffffffffffffffffffffffffffffff91909116815260200190565b6000602080830181845280855180835260408601915060408482028701019250838701855b82811015611b94577fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc088860301845281516101c0611a9987835161197f565b87820151611aa98989018261197f565b506040820151611abc604089018261197f565b506060820151611acf606089018261197f565b506080820151608088015260a082015160a088015260c082015160c088015260e082015160e08801526101008083015181890152506101208083015181890152506101408083015182828a0152611b28838a0182611999565b915050610160915081830151888203838a0152611b458282611999565b9250505061018080830151888303828a0152611b618382611999565b9150506101a0915081830151888203838a0152611b7e8282611999565b9850505094870194505090850190600101611a5a565b5092979650505050505050565b90815260200190565b91825273ffffffffffffffffffffffffffffffffffffffff16602082015260400190565b93845260ff9290921660208401526040830152606082015260800190565b6060810160088510611bfa57fe5b938152602081019290925260409091015290565b600060048510611c1a57fe5b84825283602083015260606040830152611c376060830184611999565b95945050505050565b600060208252610e3f6020830184611999565b60006040825283516040830152602084015160608301526040840151608083015273ffffffffffffffffffffffffffffffffffffffff60608501511660a0830152608084015160a060c0840152611cad60e0840182611999565b8381036020850152611cbf8186611999565b9695505050505050565b918252602082015260400190565b60405181810167ffffffffffffffff81118282101715611cf657600080fd5b604052919050565b600067ffffffffffffffff821115611d14578081fd5b5060209081020190565b600067ffffffffffffffff821115611d34578081fd5b50601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01660200190565b60005b83811015611d7b578181015183820152602001611d63565b838111156105e25750506000910152565b73ffffffffffffffffffffffffffffffffffffffff8116811461113957600080fd5b8351602094850120835193850193909320604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f815295860194909452928401929092526060830152608082015260a090209056fea365627a7a72315820926abd0f9ec1c8b67d93fbc87771f0336fe827fb0a1927bf1606417cd86e97966c6578706572696d656e74616cf564736f6c63430005100040';
    public static contractName = 'Coordinator';
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

    public static async deployWithLibrariesFrom0xArtifactAsync(
        artifact: ContractArtifact,
        libraryArtifacts: { [libraryName: string]: ContractArtifact },
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
        const abi = artifact.compilerOutput.abi;
        const logDecodeDependenciesAbiOnly: { [contractName: string]: ContractAbi } = {};
        if (Object.keys(logDecodeDependencies) !== undefined) {
            for (const key of Object.keys(logDecodeDependencies)) {
                logDecodeDependenciesAbiOnly[key] = logDecodeDependencies[key].compilerOutput.abi;
            }
        }
        const libraryAddresses = await CoordinatorContract._deployLibrariesAsync(
            artifact,
            libraryArtifacts,
            new Web3Wrapper(provider),
            txDefaults,
        );
        const bytecode = linkLibrariesInBytecode(artifact, libraryAddresses);
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

    protected static async _deployLibrariesAsync(
        artifact: ContractArtifact,
        libraryArtifacts: { [libraryName: string]: ContractArtifact },
        web3Wrapper: Web3Wrapper,
        txDefaults: Partial<TxData>,
        libraryAddresses: { [libraryName: string]: string } = {},
    ): Promise<{ [libraryName: string]: string }> {
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
                    await CoordinatorContract._deployLibrariesAsync(
                        libraryArtifact,
                        libraryArtifacts,
                        web3Wrapper,
                        txDefaults,
                        libraryAddresses,
                    );
                    // Deploy this library.
                    const linkedLibraryBytecode = linkLibrariesInBytecode(libraryArtifact, libraryAddresses);
                    const txDataWithDefaults = await BaseContract._applyDefaultsToContractTxDataAsync(
                        {
                            data: linkedLibraryBytecode,
                            ...txDefaults,
                        },
                        web3Wrapper.estimateGasAsync.bind(web3Wrapper),
                    );
                    const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                    logUtils.log(`transactionHash: ${txHash}`);
                    const { contractAddress } = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
                    logUtils.log(`${libraryArtifact.contractName} successfully deployed at ${contractAddress}`);
                    libraryAddresses[libraryArtifact.contractName] = contractAddress as string;
                }
            }
        }
        return libraryAddresses;
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
        const functionSignature = 'EIP712_COORDINATOR_APPROVAL_SCHEMA_HASH()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public EIP712_COORDINATOR_DOMAIN_HASH(): ContractFunctionObj<string> {
        const self = (this as any) as CoordinatorContract;
        const functionSignature = 'EIP712_COORDINATOR_DOMAIN_HASH()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public EIP712_COORDINATOR_DOMAIN_NAME(): ContractFunctionObj<string> {
        const self = (this as any) as CoordinatorContract;
        const functionSignature = 'EIP712_COORDINATOR_DOMAIN_NAME()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public EIP712_COORDINATOR_DOMAIN_VERSION(): ContractFunctionObj<string> {
        const self = (this as any) as CoordinatorContract;
        const functionSignature = 'EIP712_COORDINATOR_DOMAIN_VERSION()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public EIP712_EXCHANGE_DOMAIN_HASH(): ContractFunctionObj<string> {
        const self = (this as any) as CoordinatorContract;
        const functionSignature = 'EIP712_EXCHANGE_DOMAIN_HASH()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
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
        const functionSignature =
            'assertValidCoordinatorApprovals((uint256,uint256,uint256,address,bytes),address,bytes,bytes[])';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [
                    transaction,
                    txOrigin.toLowerCase(),
                    transactionSignature,
                    approvalSignatures,
                ]);
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
        const functionSignature = 'decodeOrdersFromFillData(bytes)';

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
                BaseContract._assertCallParams(callData, defaultBlock);
                let rawCallResult;
                if (self._deployedBytecodeIfExists) {
                    rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                } else {
                    rawCallResult = await self._performCallAsync(
                        { ...callData, data: this.getABIEncodedTransactionData() },
                        defaultBlock,
                    );
                }
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<
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
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [data]);
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
        const functionSignature = 'executeTransaction((uint256,uint256,uint256,address,bytes),address,bytes,bytes[])';

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
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [
                    transaction,
                    txOrigin.toLowerCase(),
                    transactionSignature,
                    approvalSignatures,
                ]);
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

        const functionSignature = 'getCoordinatorApprovalHash((address,bytes32,bytes))';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [approval]);
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
        const functionSignature = 'getSignerAddress(bytes32,bytes)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                let rawCallResult;
                if (self._deployedBytecodeIfExists) {
                    rawCallResult = await self._evmExecAsync(this.getABIEncodedTransactionData());
                } else {
                    rawCallResult = await self._performCallAsync(
                        { ...callData, data: this.getABIEncodedTransactionData() },
                        defaultBlock,
                    );
                }
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [hash, signature]);
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
