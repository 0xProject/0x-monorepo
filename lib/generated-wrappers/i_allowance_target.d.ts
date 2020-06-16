import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type IAllowanceTargetEventArgs = IAllowanceTargetAuthorizedAddressAddedEventArgs | IAllowanceTargetAuthorizedAddressRemovedEventArgs | IAllowanceTargetOwnershipTransferredEventArgs;
export declare enum IAllowanceTargetEvents {
    AuthorizedAddressAdded = "AuthorizedAddressAdded",
    AuthorizedAddressRemoved = "AuthorizedAddressRemoved",
    OwnershipTransferred = "OwnershipTransferred"
}
export interface IAllowanceTargetAuthorizedAddressAddedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}
export interface IAllowanceTargetAuthorizedAddressRemovedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}
export interface IAllowanceTargetOwnershipTransferredEventArgs extends DecodedLogArgs {
    previousOwner: string;
    newOwner: string;
}
export declare class IAllowanceTargetContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<IAllowanceTargetContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<IAllowanceTargetContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }): Promise<IAllowanceTargetContract>;
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
    /**
     * Authorizes an address.
      * @param target Address to authorize.
     */
    addAuthorizedAddress(target: string): ContractTxFunctionObj<void>;
    /**
     * All addresseses authorized to call privileged functions.
      * @param idx Index of authorized address.
     */
    authorities(idx: BigNumber): ContractTxFunctionObj<string>;
    /**
     * Whether an adderss is authorized to call privileged functions.
      * @param addr Address to query.
     */
    authorized(addr: string): ContractTxFunctionObj<boolean>;
    /**
     * Execute an arbitrary call. Only an authority can call this.
      * @param target The call target.
      * @param callData The call data.
     */
    executeCall(target: string, callData: string): ContractTxFunctionObj<string>;
    /**
     * Gets all authorized addresses.
     */
    getAuthorizedAddresses(): ContractTxFunctionObj<string[]>;
    /**
     * The owner of this contract.
     */
    owner(): ContractTxFunctionObj<string>;
    /**
     * Removes authorizion of an address.
      * @param target Address to remove authorization from.
     */
    removeAuthorizedAddress(target: string): ContractTxFunctionObj<void>;
    /**
     * Removes authorizion of an address.
      * @param target Address to remove authorization from.
      * @param index Index of target in authorities array.
     */
    removeAuthorizedAddressAtIndex(target: string, index: BigNumber): ContractTxFunctionObj<void>;
    /**
     * Transfers ownership of the contract to a new address.
      * @param newOwner The address that will become the owner.
     */
    transferOwnership(newOwner: string): ContractTxFunctionObj<void>;
    /**
     * Subscribe to an event type emitted by the IAllowanceTarget contract.
     * @param eventName The IAllowanceTarget contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends IAllowanceTargetEventArgs>(eventName: IAllowanceTargetEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The IAllowanceTarget contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends IAllowanceTargetEventArgs>(eventName: IAllowanceTargetEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=i_allowance_target.d.ts.map