// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract } from '@0x/base-contract';
import { BlockParam, BlockParamLiteral, CallData, ContractAbi, ContractArtifact, DecodedLogArgs, MethodAbi, TxData, TxDataPayable, SupportedProvider } from 'ethereum-types';
import { AbiEncoder, BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { isUndefined } from 'lodash';
// tslint:enable:no-unused-variable

export type CoordinatorRegistryEventArgs =
    | CoordinatorRegistryCoordinatorEndpointSetEventArgs;

export enum CoordinatorRegistryEvents {
    CoordinatorEndpointSet = 'CoordinatorEndpointSet',
}

export interface CoordinatorRegistryCoordinatorEndpointSetEventArgs extends DecodedLogArgs {
    coordinatorOperator: string;
    coordinatorEndpoint: string;
}


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class CoordinatorRegistryContract extends BaseContract {
    public setCoordinatorEndpoint = {
        async sendTransactionAsync(
            coordinatorEndpoint: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as CoordinatorRegistryContract;
            const encodedData = self._strictEncodeArguments('setCoordinatorEndpoint(string)', [coordinatorEndpoint
    ]);
            const gasEstimateFunction = self.setCoordinatorEndpoint.estimateGasAsync.bind(self, coordinatorEndpoint
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            coordinatorEndpoint: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as CoordinatorRegistryContract;
            const encodedData = self._strictEncodeArguments('setCoordinatorEndpoint(string)', [coordinatorEndpoint
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            coordinatorEndpoint: string,
        ): string {
            const self = this as any as CoordinatorRegistryContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('setCoordinatorEndpoint(string)', [coordinatorEndpoint
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            coordinatorEndpoint: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as CoordinatorRegistryContract;
            const encodedData = self._strictEncodeArguments('setCoordinatorEndpoint(string)', [coordinatorEndpoint
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder('setCoordinatorEndpoint(string)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getCoordinatorEndpoint = {
        async callAsync(
            coordinatorOperator: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as CoordinatorRegistryContract;
            const encodedData = self._strictEncodeArguments('getCoordinatorEndpoint(address)', [coordinatorOperator
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder('getCoordinatorEndpoint(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
    ): Promise<CoordinatorRegistryContract> {
        if (isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return CoordinatorRegistryContract.deployAsync(bytecode, abi, provider, txDefaults, );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
    ): Promise<CoordinatorRegistryContract> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [],
            BaseContract._bigNumberToString,
        );
        const encoder = new AbiEncoder.Constructor(constructorAbi);
        const txData = encoder.encode(bytecode, []);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            {data: txData},
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`CoordinatorRegistry successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new CoordinatorRegistryContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('CoordinatorRegistry', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
