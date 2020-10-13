import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type BridgeAdapterEventArgs = BridgeAdapterERC20BridgeTransferEventArgs;
export declare enum BridgeAdapterEvents {
    ERC20BridgeTransfer = "ERC20BridgeTransfer"
}
export interface BridgeAdapterERC20BridgeTransferEventArgs extends DecodedLogArgs {
    inputToken: string;
    outputToken: string;
    inputTokenAmount: BigNumber;
    outputTokenAmount: BigNumber;
    from: string;
    to: string;
}
export declare class BridgeAdapterContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, addresses: {
        balancerBridge: string;
        curveBridge: string;
        kyberBridge: string;
        mooniswapBridge: string;
        mStableBridge: string;
        oasisBridge: string;
        shellBridge: string;
        uniswapBridge: string;
        uniswapV2Bridge: string;
        kyberNetworkProxy: string;
        oasis: string;
        uniswapV2Router: string;
        uniswapExchangeFactory: string;
        mStable: string;
        shell: string;
        weth: string;
    }): Promise<BridgeAdapterContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, addresses: {
        balancerBridge: string;
        curveBridge: string;
        kyberBridge: string;
        mooniswapBridge: string;
        mStableBridge: string;
        oasisBridge: string;
        shellBridge: string;
        uniswapBridge: string;
        uniswapV2Bridge: string;
        kyberNetworkProxy: string;
        oasis: string;
        uniswapV2Router: string;
        uniswapExchangeFactory: string;
        mStable: string;
        shell: string;
        weth: string;
    }): Promise<BridgeAdapterContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, addresses: {
        balancerBridge: string;
        curveBridge: string;
        kyberBridge: string;
        mooniswapBridge: string;
        mStableBridge: string;
        oasisBridge: string;
        shellBridge: string;
        uniswapBridge: string;
        uniswapV2Bridge: string;
        kyberNetworkProxy: string;
        oasis: string;
        uniswapV2Router: string;
        uniswapExchangeFactory: string;
        mStable: string;
        shell: string;
        weth: string;
    }): Promise<BridgeAdapterContract>;
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
    trade(makerAssetData: string, sellToken: string, sellAmount: BigNumber): ContractTxFunctionObj<BigNumber>;
    /**
     * Subscribe to an event type emitted by the BridgeAdapter contract.
     * @param eventName The BridgeAdapter contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends BridgeAdapterEventArgs>(eventName: BridgeAdapterEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The BridgeAdapter contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends BridgeAdapterEventArgs>(eventName: BridgeAdapterEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=bridge_adapter.d.ts.map