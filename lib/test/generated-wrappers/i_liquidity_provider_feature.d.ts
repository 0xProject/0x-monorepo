import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type ILiquidityProviderFeatureEventArgs = ILiquidityProviderFeatureLiquidityProviderForMarketUpdatedEventArgs;
export declare enum ILiquidityProviderFeatureEvents {
    LiquidityProviderForMarketUpdated = "LiquidityProviderForMarketUpdated"
}
export interface ILiquidityProviderFeatureLiquidityProviderForMarketUpdatedEventArgs extends DecodedLogArgs {
    xAsset: string;
    yAsset: string;
    providerAddress: string;
}
export declare class ILiquidityProviderFeatureContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<ILiquidityProviderFeatureContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<ILiquidityProviderFeatureContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }): Promise<ILiquidityProviderFeatureContract>;
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
     * Returns the address of the liquidity provider for a market given
 * (xAsset, yAsset), or reverts if pool does not exist.
      * @param xAsset First asset managed by the liquidity provider.
      * @param yAsset Second asset managed by the liquidity provider.
     */
    getLiquidityProviderForMarket(xAsset: string, yAsset: string): ContractTxFunctionObj<string>;
    sellToLiquidityProvider(makerToken: string, takerToken: string, recipient: string, sellAmount: BigNumber, minBuyAmount: BigNumber): ContractTxFunctionObj<BigNumber>;
    /**
     * Sets address of the liquidity provider for a market given
 * (xAsset, yAsset).
      * @param xAsset First asset managed by the liquidity provider.
      * @param yAsset Second asset managed by the liquidity provider.
      * @param providerAddress Address of the liquidity provider.
     */
    setLiquidityProviderForMarket(xAsset: string, yAsset: string, providerAddress: string): ContractTxFunctionObj<void>;
    /**
     * Subscribe to an event type emitted by the ILiquidityProviderFeature contract.
     * @param eventName The ILiquidityProviderFeature contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends ILiquidityProviderFeatureEventArgs>(eventName: ILiquidityProviderFeatureEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The ILiquidityProviderFeature contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends ILiquidityProviderFeatureEventArgs>(eventName: ILiquidityProviderFeatureEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=i_liquidity_provider_feature.d.ts.map