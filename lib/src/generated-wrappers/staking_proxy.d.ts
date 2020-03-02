import { ContractFunctionObj, ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type StakingProxyEventArgs = StakingProxyAuthorizedAddressAddedEventArgs | StakingProxyAuthorizedAddressRemovedEventArgs | StakingProxyOwnershipTransferredEventArgs | StakingProxyStakingContractAttachedToProxyEventArgs | StakingProxyStakingContractDetachedFromProxyEventArgs;
export declare enum StakingProxyEvents {
    AuthorizedAddressAdded = "AuthorizedAddressAdded",
    AuthorizedAddressRemoved = "AuthorizedAddressRemoved",
    OwnershipTransferred = "OwnershipTransferred",
    StakingContractAttachedToProxy = "StakingContractAttachedToProxy",
    StakingContractDetachedFromProxy = "StakingContractDetachedFromProxy"
}
export interface StakingProxyAuthorizedAddressAddedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}
export interface StakingProxyAuthorizedAddressRemovedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}
export interface StakingProxyOwnershipTransferredEventArgs extends DecodedLogArgs {
    previousOwner: string;
    newOwner: string;
}
export interface StakingProxyStakingContractAttachedToProxyEventArgs extends DecodedLogArgs {
    newStakingContractAddress: string;
}
export interface StakingProxyStakingContractDetachedFromProxyEventArgs extends DecodedLogArgs {
}
export declare class StakingProxyContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }, _stakingContract: string): Promise<StakingProxyContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }, _stakingContract: string): Promise<StakingProxyContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, _stakingContract: string): Promise<StakingProxyContract>;
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
    aggregatedStatsByEpoch(index_0: BigNumber): ContractFunctionObj<[BigNumber, BigNumber, BigNumber, BigNumber, BigNumber]>;
    /**
     * Asserts that an epoch is between 5 and 30 days long.
     */
    assertValidStorageParams(): ContractFunctionObj<void>;
    /**
     * Attach a staking contract; future calls will be delegated to the staking contract. Note that this is callable only by an authorized address.
     * @param _stakingContract Address of staking contract.
     */
    attachStakingContract(_stakingContract: string): ContractTxFunctionObj<void>;
    authorities(index_0: BigNumber): ContractFunctionObj<string>;
    authorized(index_0: string): ContractFunctionObj<boolean>;
    /**
     * Batch executes a series of calls to the staking contract.
     * @param data An array of data that encodes a sequence of functions to
     *         call in the staking contracts.
     */
    batchExecute(data: string[]): ContractTxFunctionObj<string[]>;
    cobbDouglasAlphaDenominator(): ContractFunctionObj<number>;
    cobbDouglasAlphaNumerator(): ContractFunctionObj<number>;
    currentEpoch(): ContractFunctionObj<BigNumber>;
    currentEpochStartTimeInSeconds(): ContractFunctionObj<BigNumber>;
    /**
     * Detach the current staking contract. Note that this is callable only by an authorized address.
     */
    detachStakingContract(): ContractTxFunctionObj<void>;
    epochDurationInSeconds(): ContractFunctionObj<BigNumber>;
    /**
     * Gets all authorized addresses.
     * @returns Array of authorized addresses.
     */
    getAuthorizedAddresses(): ContractFunctionObj<string[]>;
    lastPoolId(): ContractFunctionObj<string>;
    minimumPoolStake(): ContractFunctionObj<BigNumber>;
    owner(): ContractFunctionObj<string>;
    poolIdByMaker(index_0: string): ContractFunctionObj<string>;
    poolStatsByEpoch(index_0: string, index_1: BigNumber): ContractFunctionObj<[BigNumber, BigNumber, BigNumber]>;
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
    rewardDelegatedStakeWeight(): ContractFunctionObj<number>;
    rewardsByPoolId(index_0: string): ContractFunctionObj<BigNumber>;
    stakingContract(): ContractFunctionObj<string>;
    /**
     * Change the owner of this contract.
     * @param newOwner New owner address.
     */
    transferOwnership(newOwner: string): ContractTxFunctionObj<void>;
    validExchanges(index_0: string): ContractFunctionObj<boolean>;
    wethReservedForPoolRewards(): ContractFunctionObj<BigNumber>;
    /**
     * Subscribe to an event type emitted by the StakingProxy contract.
     * @param eventName The StakingProxy contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends StakingProxyEventArgs>(eventName: StakingProxyEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The StakingProxy contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends StakingProxyEventArgs>(eventName: StakingProxyEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=staking_proxy.d.ts.map