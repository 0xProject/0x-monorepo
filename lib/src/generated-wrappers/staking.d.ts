import { ContractFunctionObj, ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type StakingEventArgs = StakingAuthorizedAddressAddedEventArgs | StakingAuthorizedAddressRemovedEventArgs | StakingEpochEndedEventArgs | StakingEpochFinalizedEventArgs | StakingExchangeAddedEventArgs | StakingExchangeRemovedEventArgs | StakingMakerStakingPoolSetEventArgs | StakingMoveStakeEventArgs | StakingOperatorShareDecreasedEventArgs | StakingOwnershipTransferredEventArgs | StakingParamsSetEventArgs | StakingRewardsPaidEventArgs | StakingStakeEventArgs | StakingStakingPoolCreatedEventArgs | StakingStakingPoolEarnedRewardsInEpochEventArgs | StakingUnstakeEventArgs;
export declare enum StakingEvents {
    AuthorizedAddressAdded = "AuthorizedAddressAdded",
    AuthorizedAddressRemoved = "AuthorizedAddressRemoved",
    EpochEnded = "EpochEnded",
    EpochFinalized = "EpochFinalized",
    ExchangeAdded = "ExchangeAdded",
    ExchangeRemoved = "ExchangeRemoved",
    MakerStakingPoolSet = "MakerStakingPoolSet",
    MoveStake = "MoveStake",
    OperatorShareDecreased = "OperatorShareDecreased",
    OwnershipTransferred = "OwnershipTransferred",
    ParamsSet = "ParamsSet",
    RewardsPaid = "RewardsPaid",
    Stake = "Stake",
    StakingPoolCreated = "StakingPoolCreated",
    StakingPoolEarnedRewardsInEpoch = "StakingPoolEarnedRewardsInEpoch",
    Unstake = "Unstake"
}
export interface StakingAuthorizedAddressAddedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}
export interface StakingAuthorizedAddressRemovedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}
export interface StakingEpochEndedEventArgs extends DecodedLogArgs {
    epoch: BigNumber;
    numPoolsToFinalize: BigNumber;
    rewardsAvailable: BigNumber;
    totalFeesCollected: BigNumber;
    totalWeightedStake: BigNumber;
}
export interface StakingEpochFinalizedEventArgs extends DecodedLogArgs {
    epoch: BigNumber;
    rewardsPaid: BigNumber;
    rewardsRemaining: BigNumber;
}
export interface StakingExchangeAddedEventArgs extends DecodedLogArgs {
    exchangeAddress: string;
}
export interface StakingExchangeRemovedEventArgs extends DecodedLogArgs {
    exchangeAddress: string;
}
export interface StakingMakerStakingPoolSetEventArgs extends DecodedLogArgs {
    makerAddress: string;
    poolId: string;
}
export interface StakingMoveStakeEventArgs extends DecodedLogArgs {
    staker: string;
    amount: BigNumber;
    fromStatus: number;
    fromPool: string;
    toStatus: number;
    toPool: string;
}
export interface StakingOperatorShareDecreasedEventArgs extends DecodedLogArgs {
    poolId: string;
    oldOperatorShare: number;
    newOperatorShare: number;
}
export interface StakingOwnershipTransferredEventArgs extends DecodedLogArgs {
    previousOwner: string;
    newOwner: string;
}
export interface StakingParamsSetEventArgs extends DecodedLogArgs {
    epochDurationInSeconds: BigNumber;
    rewardDelegatedStakeWeight: number;
    minimumPoolStake: BigNumber;
    cobbDouglasAlphaNumerator: BigNumber;
    cobbDouglasAlphaDenominator: BigNumber;
}
export interface StakingRewardsPaidEventArgs extends DecodedLogArgs {
    epoch: BigNumber;
    poolId: string;
    operatorReward: BigNumber;
    membersReward: BigNumber;
}
export interface StakingStakeEventArgs extends DecodedLogArgs {
    staker: string;
    amount: BigNumber;
}
export interface StakingStakingPoolCreatedEventArgs extends DecodedLogArgs {
    poolId: string;
    operator: string;
    operatorShare: number;
}
export interface StakingStakingPoolEarnedRewardsInEpochEventArgs extends DecodedLogArgs {
    epoch: BigNumber;
    poolId: string;
}
export interface StakingUnstakeEventArgs extends DecodedLogArgs {
    staker: string;
    amount: BigNumber;
}
export declare class StakingContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }): Promise<StakingContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }): Promise<StakingContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }): Promise<StakingContract>;
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
     * Adds a new exchange address
     * @param addr Address of exchange contract to add
     */
    addExchangeAddress(addr: string): ContractTxFunctionObj<void>;
    aggregatedStatsByEpoch(index_0: BigNumber): ContractFunctionObj<[BigNumber, BigNumber, BigNumber, BigNumber, BigNumber]>;
    authorities(index_0: BigNumber): ContractFunctionObj<string>;
    authorized(index_0: string): ContractFunctionObj<boolean>;
    cobbDouglasAlphaDenominator(): ContractFunctionObj<number>;
    cobbDouglasAlphaNumerator(): ContractFunctionObj<number>;
    /**
     * Computes the reward balance in ETH of a specific member of a pool.
     * @param poolId Unique id of pool.
     * @param member The member of the pool.
     * @returns totalReward Balance in ETH.
     */
    computeRewardBalanceOfDelegator(poolId: string, member: string): ContractFunctionObj<BigNumber>;
    /**
     * Computes the reward balance in ETH of the operator of a pool.
     * @param poolId Unique id of pool.
     * @returns totalReward Balance in ETH.
     */
    computeRewardBalanceOfOperator(poolId: string): ContractFunctionObj<BigNumber>;
    /**
     * Create a new staking pool. The sender will be the operator of this pool. Note that an operator must be payable.
     * @param operatorShare Portion of rewards owned by the operator, in ppm.
     * @param addOperatorAsMaker Adds operator to the created pool as a maker for
     *     convenience iff true.
     * @returns poolId The unique pool id generated for this pool.
     */
    createStakingPool(operatorShare: number | BigNumber, addOperatorAsMaker: boolean): ContractTxFunctionObj<string>;
    currentEpoch(): ContractFunctionObj<BigNumber>;
    currentEpochStartTimeInSeconds(): ContractFunctionObj<BigNumber>;
    /**
     * Decreases the operator share for the given pool (i.e. increases pool rewards for members).
     * @param poolId Unique Id of pool.
     * @param newOperatorShare The newly decreased percentage of any rewards owned
     *     by the operator.
     */
    decreaseStakingPoolOperatorShare(poolId: string, newOperatorShare: number | BigNumber): ContractTxFunctionObj<void>;
    /**
     * Begins a new epoch, preparing the prior one for finalization.
     * Throws if not enough time has passed between epochs or if the
     * previous epoch was not fully finalized.
     * @returns numPoolsToFinalize The number of unfinalized pools.
     */
    endEpoch(): ContractTxFunctionObj<BigNumber>;
    epochDurationInSeconds(): ContractFunctionObj<BigNumber>;
    /**
     * Instantly finalizes a single pool that earned rewards in the previous
     * epoch, crediting it rewards for members and withdrawing operator's
     * rewards as WETH. This can be called by internal functions that need
     * to finalize a pool immediately. Does nothing if the pool is already
     * finalized or did not earn rewards in the previous epoch.
     * @param poolId The pool ID to finalize.
     */
    finalizePool(poolId: string): ContractTxFunctionObj<void>;
    /**
     * Gets all authorized addresses.
     * @returns Array of authorized addresses.
     */
    getAuthorizedAddresses(): ContractFunctionObj<string[]>;
    /**
     * Returns the earliest end time in seconds of this epoch.
     * The next epoch can begin once this time is reached.
     * Epoch period = [startTimeInSeconds..endTimeInSeconds)
     * @returns Time in seconds.
     */
    getCurrentEpochEarliestEndTimeInSeconds(): ContractFunctionObj<BigNumber>;
    /**
     * Gets global stake for a given status.
     * @param stakeStatus UNDELEGATED or DELEGATED
     * @returns Global stake for given status.
     */
    getGlobalStakeByStatus(stakeStatus: number | BigNumber): ContractFunctionObj<{
        currentEpoch: BigNumber;
        currentEpochBalance: BigNumber;
        nextEpochBalance: BigNumber;
    }>;
    /**
     * Gets an owner's stake balances by status.
     * @param staker Owner of stake.
     * @param stakeStatus UNDELEGATED or DELEGATED
     * @returns Owner&#x27;s stake balances for given status.
     */
    getOwnerStakeByStatus(staker: string, stakeStatus: number | BigNumber): ContractFunctionObj<{
        currentEpoch: BigNumber;
        currentEpochBalance: BigNumber;
        nextEpochBalance: BigNumber;
    }>;
    /**
     * Retrieves all configurable parameter values.
     * @returns _epochDurationInSeconds Minimum seconds between epochs._rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm._minimumPoolStake Minimum amount of stake required in a pool to collect rewards._cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor._cobbDouglasAlphaDenominator Denominator for cobb douglas alpha factor.
     */
    getParams(): ContractFunctionObj<[BigNumber, number, BigNumber, number, number]>;
    /**
     * Returns the stake delegated to a specific staking pool, by a given staker.
     * @param staker of stake.
     * @param poolId Unique Id of pool.
     * @returns Stake delegated to pool by staker.
     */
    getStakeDelegatedToPoolByOwner(staker: string, poolId: string): ContractFunctionObj<{
        currentEpoch: BigNumber;
        currentEpochBalance: BigNumber;
        nextEpochBalance: BigNumber;
    }>;
    /**
     * Returns a staking pool
     * @param poolId Unique id of pool.
     */
    getStakingPool(poolId: string): ContractFunctionObj<{
        operator: string;
        operatorShare: number;
    }>;
    /**
     * Get stats on a staking pool in this epoch.
     * @param poolId Pool Id to query.
     * @returns PoolStats struct for pool id.
     */
    getStakingPoolStatsThisEpoch(poolId: string): ContractFunctionObj<{
        feesCollected: BigNumber;
        weightedStake: BigNumber;
        membersStake: BigNumber;
    }>;
    /**
     * Returns the total stake for a given staker.
     * @param staker of stake.
     * @returns Total ZRX staked by &#x60;staker&#x60;.
     */
    getTotalStake(staker: string): ContractFunctionObj<BigNumber>;
    /**
     * Returns the total stake delegated to a specific staking pool,
     * across all members.
     * @param poolId Unique Id of pool.
     * @returns Total stake delegated to pool.
     */
    getTotalStakeDelegatedToPool(poolId: string): ContractFunctionObj<{
        currentEpoch: BigNumber;
        currentEpochBalance: BigNumber;
        nextEpochBalance: BigNumber;
    }>;
    /**
     * An overridable way to access the deployed WETH contract.
     * Must be view to allow overrides to access state.
     * @returns wethContract The WETH contract instance.
     */
    getWethContract(): ContractFunctionObj<string>;
    /**
     * An overridable way to access the deployed zrxVault.
     * Must be view to allow overrides to access state.
     * @returns zrxVault The zrxVault contract.
     */
    getZrxVault(): ContractFunctionObj<string>;
    /**
     * Initialize storage owned by this contract.
     * This function should not be called directly.
     * The StakingProxy contract will call it in `attachStakingContract()`.
     */
    init(): ContractTxFunctionObj<void>;
    /**
     * Allows caller to join a staking pool as a maker.
     * @param poolId Unique id of pool.
     */
    joinStakingPoolAsMaker(poolId: string): ContractTxFunctionObj<void>;
    lastPoolId(): ContractFunctionObj<string>;
    minimumPoolStake(): ContractFunctionObj<BigNumber>;
    /**
     * Moves stake between statuses: 'undelegated' or 'delegated'.
     * Delegated stake can also be moved between pools.
     * This change comes into effect next epoch.
     * @param from Status to move stake out of.
     * @param to Status to move stake into.
     * @param amount Amount of stake to move.
     */
    moveStake(from: {
        status: number | BigNumber;
        poolId: string;
    }, to: {
        status: number | BigNumber;
        poolId: string;
    }, amount: BigNumber): ContractTxFunctionObj<void>;
    owner(): ContractFunctionObj<string>;
    /**
     * Pays a protocol fee in ETH or WETH.
     * Only a known 0x exchange can call this method. See
     * (MixinExchangeManager).
     * @param makerAddress The address of the order's maker.
     * @param payerAddress The address of the protocol fee payer.
     * @param protocolFee The protocol fee amount. This is either passed as ETH or
     *     transferred as WETH.
     */
    payProtocolFee(makerAddress: string, payerAddress: string, protocolFee: BigNumber): ContractTxFunctionObj<void>;
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
    /**
     * Removes an existing exchange address
     * @param addr Address of exchange contract to remove
     */
    removeExchangeAddress(addr: string): ContractTxFunctionObj<void>;
    rewardDelegatedStakeWeight(): ContractFunctionObj<number>;
    rewardsByPoolId(index_0: string): ContractFunctionObj<BigNumber>;
    /**
     * Set all configurable parameters at once.
     * @param _epochDurationInSeconds Minimum seconds between epochs.
     * @param _rewardDelegatedStakeWeight How much delegated stake is weighted vs
     *     operator stake, in ppm.
     * @param _minimumPoolStake Minimum amount of stake required in a pool to
     *     collect rewards.
     * @param _cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
     * @param _cobbDouglasAlphaDenominator Denominator for cobb douglas alpha
     *     factor.
     */
    setParams(_epochDurationInSeconds: BigNumber, _rewardDelegatedStakeWeight: number | BigNumber, _minimumPoolStake: BigNumber, _cobbDouglasAlphaNumerator: number | BigNumber, _cobbDouglasAlphaDenominator: number | BigNumber): ContractTxFunctionObj<void>;
    /**
     * Stake ZRX tokens. Tokens are deposited into the ZRX Vault.
     * Unstake to retrieve the ZRX. Stake is in the 'Active' status.
     * @param amount Amount of ZRX to stake.
     */
    stake(amount: BigNumber): ContractTxFunctionObj<void>;
    stakingContract(): ContractFunctionObj<string>;
    /**
     * Change the owner of this contract.
     * @param newOwner New owner address.
     */
    transferOwnership(newOwner: string): ContractTxFunctionObj<void>;
    /**
     * Unstake. Tokens are withdrawn from the ZRX Vault and returned to
     * the staker. Stake must be in the 'undelegated' status in both the
     * current and next epoch in order to be unstaked.
     * @param amount Amount of ZRX to unstake.
     */
    unstake(amount: BigNumber): ContractTxFunctionObj<void>;
    validExchanges(index_0: string): ContractFunctionObj<boolean>;
    wethReservedForPoolRewards(): ContractFunctionObj<BigNumber>;
    /**
     * Withdraws the caller's WETH rewards that have accumulated
     * until the last epoch.
     * @param poolId Unique id of pool.
     */
    withdrawDelegatorRewards(poolId: string): ContractTxFunctionObj<void>;
    /**
     * Subscribe to an event type emitted by the Staking contract.
     * @param eventName The Staking contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends StakingEventArgs>(eventName: StakingEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The Staking contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends StakingEventArgs>(eventName: StakingEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=staking.d.ts.map