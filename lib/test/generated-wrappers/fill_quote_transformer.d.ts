import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type FillQuoteTransformerEventArgs = FillQuoteTransformerProtocolFeeUnfundedEventArgs;
export declare enum FillQuoteTransformerEvents {
    ProtocolFeeUnfunded = "ProtocolFeeUnfunded"
}
export interface FillQuoteTransformerProtocolFeeUnfundedEventArgs extends DecodedLogArgs {
    ethBalance: BigNumber;
    ethNeeded: BigNumber;
}
export declare class FillQuoteTransformerContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, exchange_: string, bridgeAdapter_: string): Promise<FillQuoteTransformerContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, exchange_: string, bridgeAdapter_: string): Promise<FillQuoteTransformerContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, exchange_: string, bridgeAdapter_: string): Promise<FillQuoteTransformerContract>;
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
    bridgeAdapter(): ContractTxFunctionObj<string>;
    deployer(): ContractTxFunctionObj<string>;
    /**
     * Destruct this contract. Only callable by the deployer and will not
 * succeed in the context of a delegatecall (from another contract).
      * @param ethRecipient The recipient of ETH held in this contract.
     */
    die(ethRecipient: string): ContractTxFunctionObj<void>;
    erc20Proxy(): ContractTxFunctionObj<string>;
    exchange(): ContractTxFunctionObj<string>;
    /**
     * Sell this contract's entire balance of of `sellToken` in exchange
 * for `buyToken` by filling `orders`. Protocol fees should be attached
 * to this call. `buyToken` and excess ETH will be transferred back to the caller.
      * @param context Context information.
     */
    transform(context: {
        callDataHash: string;
        sender: string;
        taker: string;
        data: string;
    }): ContractTxFunctionObj<string>;
    /**
     * Subscribe to an event type emitted by the FillQuoteTransformer contract.
     * @param eventName The FillQuoteTransformer contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends FillQuoteTransformerEventArgs>(eventName: FillQuoteTransformerEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The FillQuoteTransformer contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends FillQuoteTransformerEventArgs>(eventName: FillQuoteTransformerEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=fill_quote_transformer.d.ts.map