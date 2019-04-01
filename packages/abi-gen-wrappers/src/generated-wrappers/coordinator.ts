// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract } from '@0x/base-contract';
import { BlockParam, BlockParamLiteral, CallData, ContractAbi, ContractArtifact, DecodedLogArgs, MethodAbi, TxData, TxDataPayable, SupportedProvider } from 'ethereum-types';
import { BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as ethers from 'ethers';
import * as _ from 'lodash';
// tslint:enable:no-unused-variable


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class CoordinatorContract extends BaseContract {
    public getSignerAddress = {
        async callAsync(
            hash: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as CoordinatorContract;
            const encodedData = self._strictEncodeArguments('getSignerAddress(bytes32,bytes)', [hash,
        signature
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getSignerAddress(bytes32,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getTransactionHash = {
        async callAsync(
            transaction: {salt: BigNumber;signerAddress: string;data: string},
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as CoordinatorContract;
            const encodedData = self._strictEncodeArguments('getTransactionHash((uint256,address,bytes))', [transaction
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getTransactionHash((uint256,address,bytes))');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getCoordinatorApprovalHash = {
        async callAsync(
            approval: {txOrigin: string;transactionHash: string;transactionSignature: string;approvalExpirationTimeSeconds: BigNumber},
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as CoordinatorContract;
            const encodedData = self._strictEncodeArguments('getCoordinatorApprovalHash((address,bytes32,bytes,uint256))', [approval
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getCoordinatorApprovalHash((address,bytes32,bytes,uint256))');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public executeTransaction = {
        async sendTransactionAsync(
            transaction: {salt: BigNumber;signerAddress: string;data: string},
            txOrigin: string,
            transactionSignature: string,
            approvalExpirationTimeSeconds: BigNumber[],
            approvalSignatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as CoordinatorContract;
            const encodedData = self._strictEncodeArguments('executeTransaction((uint256,address,bytes),address,bytes,uint256[],bytes[])', [transaction,
    txOrigin,
    transactionSignature,
    approvalExpirationTimeSeconds,
    approvalSignatures
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.executeTransaction.estimateGasAsync.bind(
                    self,
                    transaction,
                    txOrigin,
                    transactionSignature,
                    approvalExpirationTimeSeconds,
                    approvalSignatures
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            transaction: {salt: BigNumber;signerAddress: string;data: string},
            txOrigin: string,
            transactionSignature: string,
            approvalExpirationTimeSeconds: BigNumber[],
            approvalSignatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as CoordinatorContract;
            const encodedData = self._strictEncodeArguments('executeTransaction((uint256,address,bytes),address,bytes,uint256[],bytes[])', [transaction,
    txOrigin,
    transactionSignature,
    approvalExpirationTimeSeconds,
    approvalSignatures
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            transaction: {salt: BigNumber;signerAddress: string;data: string},
            txOrigin: string,
            transactionSignature: string,
            approvalExpirationTimeSeconds: BigNumber[],
            approvalSignatures: string[],
        ): string {
            const self = this as any as CoordinatorContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('executeTransaction((uint256,address,bytes),address,bytes,uint256[],bytes[])', [transaction,
    txOrigin,
    transactionSignature,
    approvalExpirationTimeSeconds,
    approvalSignatures
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            transaction: {salt: BigNumber;signerAddress: string;data: string},
            txOrigin: string,
            transactionSignature: string,
            approvalExpirationTimeSeconds: BigNumber[],
            approvalSignatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as CoordinatorContract;
            const encodedData = self._strictEncodeArguments('executeTransaction((uint256,address,bytes),address,bytes,uint256[],bytes[])', [transaction,
        txOrigin,
        transactionSignature,
        approvalExpirationTimeSeconds,
        approvalSignatures
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('executeTransaction((uint256,address,bytes),address,bytes,uint256[],bytes[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public EIP712_EXCHANGE_DOMAIN_HASH = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as CoordinatorContract;
            const encodedData = self._strictEncodeArguments('EIP712_EXCHANGE_DOMAIN_HASH()', []);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('EIP712_EXCHANGE_DOMAIN_HASH()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public assertValidCoordinatorApprovals = {
        async callAsync(
            transaction: {salt: BigNumber;signerAddress: string;data: string},
            txOrigin: string,
            transactionSignature: string,
            approvalExpirationTimeSeconds: BigNumber[],
            approvalSignatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as CoordinatorContract;
            const encodedData = self._strictEncodeArguments('assertValidCoordinatorApprovals((uint256,address,bytes),address,bytes,uint256[],bytes[])', [transaction,
        txOrigin,
        transactionSignature,
        approvalExpirationTimeSeconds,
        approvalSignatures
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('assertValidCoordinatorApprovals((uint256,address,bytes),address,bytes,uint256[],bytes[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public decodeOrdersFromFillData = {
        async callAsync(
            data: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>
        > {
            const self = this as any as CoordinatorContract;
            const encodedData = self._strictEncodeArguments('decodeOrdersFromFillData(bytes)', [data
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('decodeOrdersFromFillData(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public EIP712_COORDINATOR_DOMAIN_HASH = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as CoordinatorContract;
            const encodedData = self._strictEncodeArguments('EIP712_COORDINATOR_DOMAIN_HASH()', []);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('EIP712_COORDINATOR_DOMAIN_HASH()');
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
            exchange: string,
            chainId: BigNumber,
    ): Promise<CoordinatorContract> {
        if (artifact.compilerOutput === undefined) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return CoordinatorContract.deployAsync(bytecode, abi, provider, txDefaults, exchange,
chainId
);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
            exchange: string,
            chainId: BigNumber,
    ): Promise<CoordinatorContract> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [exchange,
chainId
] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [exchange,
chainId
],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [exchange,
chainId
]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            {data: txData},
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`Coordinator successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new CoordinatorContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [exchange,
chainId
];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('Coordinator', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
