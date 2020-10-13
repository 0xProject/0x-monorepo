import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type TransformerDeployerEventArgs = TransformerDeployerAuthorizedAddressAddedEventArgs | TransformerDeployerAuthorizedAddressRemovedEventArgs | TransformerDeployerDeployedEventArgs | TransformerDeployerKilledEventArgs | TransformerDeployerOwnershipTransferredEventArgs;
export declare enum TransformerDeployerEvents {
    AuthorizedAddressAdded = "AuthorizedAddressAdded",
    AuthorizedAddressRemoved = "AuthorizedAddressRemoved",
    Deployed = "Deployed",
    Killed = "Killed",
    OwnershipTransferred = "OwnershipTransferred"
}
export interface TransformerDeployerAuthorizedAddressAddedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}
export interface TransformerDeployerAuthorizedAddressRemovedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}
export interface TransformerDeployerDeployedEventArgs extends DecodedLogArgs {
    deployedAddress: string;
    nonce: BigNumber;
    sender: string;
}
export interface TransformerDeployerKilledEventArgs extends DecodedLogArgs {
    target: string;
    sender: string;
}
export interface TransformerDeployerOwnershipTransferredEventArgs extends DecodedLogArgs {
    previousOwner: string;
    newOwner: string;
}
export declare class TransformerDeployerContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, initialAuthorities: string[]): Promise<TransformerDeployerContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, initialAuthorities: string[]): Promise<TransformerDeployerContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, initialAuthorities: string[]): Promise<TransformerDeployerContract>;
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
    authorities(index_0: BigNumber): ContractTxFunctionObj<string>;
    authorized(index_0: string): ContractTxFunctionObj<boolean>;
    /**
     * Deploy a new contract. Only callable by an authority.
 * Any attached ETH will also be forwarded.
     */
    deploy(bytecode: string): ContractTxFunctionObj<string>;
    /**
     * Gets all authorized addresses.
     */
    getAuthorizedAddresses(): ContractTxFunctionObj<string[]>;
    /**
     * Call `die()` on a contract. Only callable by an authority.
      * @param target The target contract to call `die()` on.
      * @param ethRecipient The Recipient of any ETH locked in `target`.
     */
    kill(target: string, ethRecipient: string): ContractTxFunctionObj<void>;
    nonce(): ContractTxFunctionObj<BigNumber>;
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
    toDeploymentNonce(index_0: string): ContractTxFunctionObj<BigNumber>;
    /**
     * Change the owner of this contract.
      * @param newOwner New owner address.
     */
    transferOwnership(newOwner: string): ContractTxFunctionObj<void>;
    /**
     * Subscribe to an event type emitted by the TransformerDeployer contract.
     * @param eventName The TransformerDeployer contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends TransformerDeployerEventArgs>(eventName: TransformerDeployerEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The TransformerDeployer contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends TransformerDeployerEventArgs>(eventName: TransformerDeployerEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=transformer_deployer.d.ts.map