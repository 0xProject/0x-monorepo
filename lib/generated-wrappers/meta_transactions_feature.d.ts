import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type MetaTransactionsFeatureEventArgs = MetaTransactionsFeatureMetaTransactionExecutedEventArgs;
export declare enum MetaTransactionsFeatureEvents {
    MetaTransactionExecuted = "MetaTransactionExecuted"
}
export interface MetaTransactionsFeatureMetaTransactionExecutedEventArgs extends DecodedLogArgs {
    hash: string;
    selector: string;
    signer: string;
    sender: string;
}
export declare class MetaTransactionsFeatureContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, zeroExAddress: string): Promise<MetaTransactionsFeatureContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, zeroExAddress: string): Promise<MetaTransactionsFeatureContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, zeroExAddress: string): Promise<MetaTransactionsFeatureContract>;
    /**
     * @returns      The contract ABI
     */
    static ABI(): ContractAbi;
    protected static _deployLibrariesAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, web3Wrapper: Web3Wrapper, txDefaults: Partial<TxData>, libraryAddresses?: {
        [libraryName: string]: string;
    }): Promise<{
        [libraryName: string]: string;
    }>;
    getFunctionSignature(methodName: string): string;
    getABIDecodedTransactionData<T>(methodName: string, callData: string): T;
    getABIDecodedReturnData<T>(methodName: string, callData: string): T;
    getSelector(methodName: string): string;
    EIP712_DOMAIN_SEPARATOR(): ContractTxFunctionObj<string>;
    FEATURE_NAME(): ContractTxFunctionObj<string>;
    FEATURE_VERSION(): ContractTxFunctionObj<BigNumber>;
    MTX_EIP712_TYPEHASH(): ContractTxFunctionObj<string>;
    /**
     * Execute a meta-transaction via `sender`. Privileged variant.
 * Only callable from within.
      * @param sender Who is executing the meta-transaction.
      * @param mtx The meta-transaction.
      * @param signature The signature by `mtx.signer`.
     */
    _executeMetaTransaction(sender: string, mtx: {
        signer: string;
        sender: string;
        minGasPrice: BigNumber;
        maxGasPrice: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        callData: string;
        value: BigNumber;
        feeToken: string;
        feeAmount: BigNumber;
    }, signature: string): ContractTxFunctionObj<string>;
    /**
     * Execute multiple meta-transactions.
      * @param mtxs The meta-transactions.
      * @param signatures The signature by each respective `mtx.signer`.
     */
    batchExecuteMetaTransactions(mtxs: Array<{
        signer: string;
        sender: string;
        minGasPrice: BigNumber;
        maxGasPrice: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        callData: string;
        value: BigNumber;
        feeToken: string;
        feeAmount: BigNumber;
    }>, signatures: string[]): ContractTxFunctionObj<string[]>;
    /**
     * Execute a single meta-transaction.
      * @param mtx The meta-transaction.
      * @param signature The signature by `mtx.signer`.
     */
    executeMetaTransaction(mtx: {
        signer: string;
        sender: string;
        minGasPrice: BigNumber;
        maxGasPrice: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        callData: string;
        value: BigNumber;
        feeToken: string;
        feeAmount: BigNumber;
    }, signature: string): ContractTxFunctionObj<string>;
    /**
     * Get the block at which a meta-transaction has been executed.
      * @param mtx The meta-transaction.
     */
    getMetaTransactionExecutedBlock(mtx: {
        signer: string;
        sender: string;
        minGasPrice: BigNumber;
        maxGasPrice: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        callData: string;
        value: BigNumber;
        feeToken: string;
        feeAmount: BigNumber;
    }): ContractTxFunctionObj<BigNumber>;
    /**
     * Get the EIP712 hash of a meta-transaction.
      * @param mtx The meta-transaction.
     */
    getMetaTransactionHash(mtx: {
        signer: string;
        sender: string;
        minGasPrice: BigNumber;
        maxGasPrice: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        callData: string;
        value: BigNumber;
        feeToken: string;
        feeAmount: BigNumber;
    }): ContractTxFunctionObj<string>;
    /**
     * Get the block at which a meta-transaction hash has been executed.
      * @param mtxHash The meta-transaction hash.
     */
    getMetaTransactionHashExecutedBlock(mtxHash: string): ContractTxFunctionObj<BigNumber>;
    /**
     * Initialize and register this feature.
 * Should be delegatecalled by `Migrate.migrate()`.
     */
    migrate(): ContractTxFunctionObj<string>;
    /**
     * Subscribe to an event type emitted by the MetaTransactionsFeature contract.
     * @param eventName The MetaTransactionsFeature contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends MetaTransactionsFeatureEventArgs>(eventName: MetaTransactionsFeatureEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
    /**
     * Cancel a subscription
     * @param subscriptionToken Subscription token returned by `subscribe()`
     */
    unsubscribe(subscriptionToken: string): void;
    /**
     * Cancels all existing subscriptions
     */
    unsubscribeAll(): void;
    /**
     * Gets historical logs without creating a subscription
     * @param eventName The MetaTransactionsFeature contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends MetaTransactionsFeatureEventArgs>(eventName: MetaTransactionsFeatureEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=meta_transactions_feature.d.ts.map