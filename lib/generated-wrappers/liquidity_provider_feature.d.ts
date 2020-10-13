import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type LiquidityProviderFeatureEventArgs = LiquidityProviderFeatureLiquidityProviderForMarketUpdatedEventArgs;
export declare enum LiquidityProviderFeatureEvents {
    LiquidityProviderForMarketUpdated = "LiquidityProviderForMarketUpdated"
}
export interface LiquidityProviderFeatureLiquidityProviderForMarketUpdatedEventArgs extends DecodedLogArgs {
    xAsset: string;
    yAsset: string;
    providerAddress: string;
}
export declare class LiquidityProviderFeatureContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, weth_: string): Promise<LiquidityProviderFeatureContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, weth_: string): Promise<LiquidityProviderFeatureContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, weth_: string): Promise<LiquidityProviderFeatureContract>;
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
     * Returns the address of the liquidity provider for a market given
 * (xAsset, yAsset), or reverts if pool does not exist.
      * @param xAsset First asset managed by the liquidity provider.
      * @param yAsset Second asset managed by the liquidity provider.
     */
    getLiquidityProviderForMarket(xAsset: string, yAsset: string): ContractTxFunctionObj<string>;
    /**
     * Initialize and register this feature.
 * Should be delegatecalled by `Migrate.migrate()`.
     */
    migrate(): ContractTxFunctionObj<string>;
    sellToLiquidityProvider(makerToken: string, takerToken: string, recipient: string, sellAmount: BigNumber, minBuyAmount: BigNumber): ContractTxFunctionObj<BigNumber>;
    /**
     * Sets address of the liquidity provider for a market given
 * (xAsset, yAsset).
      * @param xAsset First asset managed by the liquidity provider.
      * @param yAsset Second asset managed by the liquidity provider.
      * @param providerAddress Address of the liquidity provider.
     */
    setLiquidityProviderForMarket(xAsset: string, yAsset: string, providerAddress: string): ContractTxFunctionObj<void>;
    weth(): ContractTxFunctionObj<string>;
    /**
     * Subscribe to an event type emitted by the LiquidityProviderFeature contract.
     * @param eventName The LiquidityProviderFeature contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends LiquidityProviderFeatureEventArgs>(eventName: LiquidityProviderFeatureEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The LiquidityProviderFeature contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends LiquidityProviderFeatureEventArgs>(eventName: LiquidityProviderFeatureEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=liquidity_provider_feature.d.ts.map