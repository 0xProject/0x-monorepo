import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type TransformERC20EventArgs = TransformERC20QuoteSignerUpdatedEventArgs | TransformERC20TransformedERC20EventArgs | TransformERC20TransformerDeployerUpdatedEventArgs;
export declare enum TransformERC20Events {
    QuoteSignerUpdated = "QuoteSignerUpdated",
    TransformedERC20 = "TransformedERC20",
    TransformerDeployerUpdated = "TransformerDeployerUpdated"
}
export interface TransformERC20QuoteSignerUpdatedEventArgs extends DecodedLogArgs {
    quoteSigner: string;
}
export interface TransformERC20TransformedERC20EventArgs extends DecodedLogArgs {
    taker: string;
    inputToken: string;
    outputToken: string;
    inputTokenAmount: BigNumber;
    outputTokenAmount: BigNumber;
}
export interface TransformERC20TransformerDeployerUpdatedEventArgs extends DecodedLogArgs {
    transformerDeployer: string;
}
export declare class TransformERC20Contract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<TransformERC20Contract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<TransformERC20Contract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }): Promise<TransformERC20Contract>;
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
     * Internal version of `transformERC20()`. Only callable from within.
      * @param args A `TransformERC20Args` struct.
     */
    _transformERC20(args: {
        taker: string;
        inputToken: string;
        outputToken: string;
        inputTokenAmount: BigNumber;
        minOutputTokenAmount: BigNumber;
        transformations: Array<{
            deploymentNonce: number | BigNumber;
            data: string;
        }>;
        callDataHash: string;
        callDataSignature: string;
    }): ContractTxFunctionObj<BigNumber>;
    /**
     * Deploy a new wallet instance and replace the current one with it.
 * Useful if we somehow break the current wallet instance.
 * Only callable by the owner.
     */
    createTransformWallet(): ContractTxFunctionObj<string>;
    /**
     * Return the optional signer for `transformERC20()` calldata.
     */
    getQuoteSigner(): ContractTxFunctionObj<string>;
    /**
     * Return the current wallet instance that will serve as the execution
 * context for transformations.
     */
    getTransformWallet(): ContractTxFunctionObj<string>;
    /**
     * Return the allowed deployer for transformers.
     */
    getTransformerDeployer(): ContractTxFunctionObj<string>;
    /**
     * Initialize and register this feature.
 * Should be delegatecalled by `Migrate.migrate()`.
      * @param transformerDeployer The trusted deployer for transformers.
     */
    migrate(transformerDeployer: string): ContractTxFunctionObj<string>;
    /**
     * Replace the optional signer for `transformERC20()` calldata.
 * Only callable by the owner.
      * @param quoteSigner The address of the new calldata signer.
     */
    setQuoteSigner(quoteSigner: string): ContractTxFunctionObj<void>;
    /**
     * Replace the allowed deployer for transformers.
 * Only callable by the owner.
      * @param transformerDeployer The address of the trusted deployer for
     *     transformers.
     */
    setTransformerDeployer(transformerDeployer: string): ContractTxFunctionObj<void>;
    /**
     * Executes a series of transformations to convert an ERC20 `inputToken`
 * to an ERC20 `outputToken`.
      * @param inputToken The token being provided by the sender.        If
     *     `0xeee...`, ETH is implied and should be provided with the call.`
      * @param outputToken The token to be acquired by the sender.        `0xeee...`
     *     implies ETH.
      * @param inputTokenAmount The amount of `inputToken` to take from the sender.
     *           If set to `uint256(-1)`, the entire spendable balance of the taker
     *            will be solt.
      * @param minOutputTokenAmount The minimum amount of `outputToken` the sender
     *          must receive for the entire transformation to succeed. If set to
     *     zero,        the minimum output token transfer will not be asserted.
      * @param transformations The transformations to execute on the token
     *     balance(s)        in sequence.
     */
    transformERC20(inputToken: string, outputToken: string, inputTokenAmount: BigNumber, minOutputTokenAmount: BigNumber, transformations: Array<{
        deploymentNonce: number | BigNumber;
        data: string;
    }>): ContractTxFunctionObj<BigNumber>;
    /**
     * Subscribe to an event type emitted by the TransformERC20 contract.
     * @param eventName The TransformERC20 contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends TransformERC20EventArgs>(eventName: TransformERC20Events, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The TransformERC20 contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends TransformERC20EventArgs>(eventName: TransformERC20Events, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=transform_erc20.d.ts.map