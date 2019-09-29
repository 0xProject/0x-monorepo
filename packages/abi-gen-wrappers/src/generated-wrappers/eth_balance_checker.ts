// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import { BaseContract, PromiseWithTransactionHash } from '@0x/base-contract';
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
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class EthBalanceCheckerContract extends BaseContract {
    public static deployedBytecode =
        '0x608060405234801561001057600080fd5b506004361061002b5760003560e01c8063a0901e5114610030575b600080fd5b6100d36004803603602081101561004657600080fd5b81019060208101813564010000000081111561006157600080fd5b82018360208201111561007357600080fd5b8035906020019184602083028401116401000000008311171561009557600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600092019190915250929550610123945050505050565b60408051602080825283518183015283519192839290830191858101910280838360005b8381101561010f5781810151838201526020016100f7565b505050509050019250505060405180910390f35b6060808251604051908082528060200260200182016040528015610151578160200160208202803883390190505b50905060005b835181146101a95783818151811061016b57fe5b602002602001015173ffffffffffffffffffffffffffffffffffffffff163182828151811061019657fe5b6020908102919091010152600101610157565b509291505056fea265627a7a72315820df367235df12381c7051c3ab202d79df7a4451cb2217e4d0ae307a332c552bfd64736f6c634300050b0032';
    /**
     * Batch fetches ETH balances
     */
    public getEthBalances = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param addresses Array of addresses.
         * @returns Array of ETH balances.
         */
        async callAsync(
            addresses: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber[]> {
            assert.isArray('addresses', addresses);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as EthBalanceCheckerContract;
            const encodedData = self._strictEncodeArguments('getEthBalances(address[])', [addresses]);
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
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getEthBalances(address[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param addresses Array of addresses.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(addresses: string[]): string {
            assert.isArray('addresses', addresses);
            const self = (this as any) as EthBalanceCheckerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getEthBalances(address[])', [addresses]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string[] {
            const self = (this as any) as EthBalanceCheckerContract;
            const abiEncoder = self._lookupAbiEncoder('getEthBalances(address[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string[]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber[] {
            const self = (this as any) as EthBalanceCheckerContract;
            const abiEncoder = self._lookupAbiEncoder('getEthBalances(address[])');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber[]>(returnData);
            return abiDecodedReturnData;
        },
        /**
         * Returns the 4 byte function selector as a hex string.
         */
        getSelector(): string {
            const self = (this as any) as EthBalanceCheckerContract;
            const abiEncoder = self._lookupAbiEncoder('getEthBalances(address[])');
            return abiEncoder.getSelector();
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<EthBalanceCheckerContract> {
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
        return EthBalanceCheckerContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
    ): Promise<EthBalanceCheckerContract> {
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
        logUtils.log(`EthBalanceChecker successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new EthBalanceCheckerContract(
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
                        name: 'addresses',
                        type: 'address[]',
                    },
                ],
                name: 'getEthBalances',
                outputs: [
                    {
                        name: '',
                        type: 'uint256[]',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
        ] as ContractAbi;
        return abi;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = EthBalanceCheckerContract.deployedBytecode,
    ) {
        super(
            'EthBalanceChecker',
            EthBalanceCheckerContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
