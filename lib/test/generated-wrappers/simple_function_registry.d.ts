import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type SimpleFunctionRegistryEventArgs = SimpleFunctionRegistryProxyFunctionUpdatedEventArgs;
export declare enum SimpleFunctionRegistryEvents {
    ProxyFunctionUpdated = "ProxyFunctionUpdated"
}
export interface SimpleFunctionRegistryProxyFunctionUpdatedEventArgs extends DecodedLogArgs {
    selector: string;
    oldImpl: string;
    newImpl: string;
}
export declare class SimpleFunctionRegistryContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<SimpleFunctionRegistryContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<SimpleFunctionRegistryContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }): Promise<SimpleFunctionRegistryContract>;
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
    FEATURE_NAME(): ContractTxFunctionObj<string>;
    FEATURE_VERSION(): ContractTxFunctionObj<BigNumber>;
    /**
     * Register or replace a function.
 * Only callable from within.
 * This function is only used during the bootstrap process and
 * should be deregistered by the deployer after bootstrapping is
 * complete.
      * @param selector The function selector.
      * @param impl The implementation contract for the function.
     */
    _extendSelf(selector: string, impl: string): ContractTxFunctionObj<void>;
    /**
     * Initializes this feature, registering its own functions.
     */
    bootstrap(): ContractTxFunctionObj<string>;
    /**
     * Register or replace a function.
 * Only directly callable by an authority.
      * @param selector The function selector.
      * @param impl The implementation contract for the function.
     */
    extend(selector: string, impl: string): ContractTxFunctionObj<void>;
    /**
     * Retrieve an entry in the rollback history for a function.
      * @param selector The function selector.
      * @param idx The index in the rollback history.
     */
    getRollbackEntryAtIndex(selector: string, idx: BigNumber): ContractTxFunctionObj<string>;
    /**
     * Retrieve the length of the rollback history for a function.
      * @param selector The function selector.
     */
    getRollbackLength(selector: string): ContractTxFunctionObj<BigNumber>;
    /**
     * Roll back to a prior implementation of a function.
 * Only directly callable by an authority.
      * @param selector The function selector.
      * @param targetImpl The address of an older implementation of the function.
     */
    rollback(selector: string, targetImpl: string): ContractTxFunctionObj<void>;
    /**
     * Subscribe to an event type emitted by the SimpleFunctionRegistry contract.
     * @param eventName The SimpleFunctionRegistry contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends SimpleFunctionRegistryEventArgs>(eventName: SimpleFunctionRegistryEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The SimpleFunctionRegistry contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends SimpleFunctionRegistryEventArgs>(eventName: SimpleFunctionRegistryEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=simple_function_registry.d.ts.map