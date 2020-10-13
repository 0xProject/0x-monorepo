import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type IZeroExEventArgs = IZeroExLiquidityProviderForMarketUpdatedEventArgs | IZeroExMetaTransactionExecutedEventArgs | IZeroExMigratedEventArgs | IZeroExOwnershipTransferredEventArgs | IZeroExProxyFunctionUpdatedEventArgs | IZeroExQuoteSignerUpdatedEventArgs | IZeroExTransformedERC20EventArgs | IZeroExTransformerDeployerUpdatedEventArgs;
export declare enum IZeroExEvents {
    LiquidityProviderForMarketUpdated = "LiquidityProviderForMarketUpdated",
    MetaTransactionExecuted = "MetaTransactionExecuted",
    Migrated = "Migrated",
    OwnershipTransferred = "OwnershipTransferred",
    ProxyFunctionUpdated = "ProxyFunctionUpdated",
    QuoteSignerUpdated = "QuoteSignerUpdated",
    TransformedERC20 = "TransformedERC20",
    TransformerDeployerUpdated = "TransformerDeployerUpdated"
}
export interface IZeroExLiquidityProviderForMarketUpdatedEventArgs extends DecodedLogArgs {
    xAsset: string;
    yAsset: string;
    providerAddress: string;
}
export interface IZeroExMetaTransactionExecutedEventArgs extends DecodedLogArgs {
    hash: string;
    selector: string;
    signer: string;
    sender: string;
}
export interface IZeroExMigratedEventArgs extends DecodedLogArgs {
    caller: string;
    migrator: string;
    newOwner: string;
}
export interface IZeroExOwnershipTransferredEventArgs extends DecodedLogArgs {
    previousOwner: string;
    newOwner: string;
}
export interface IZeroExProxyFunctionUpdatedEventArgs extends DecodedLogArgs {
    selector: string;
    oldImpl: string;
    newImpl: string;
}
export interface IZeroExQuoteSignerUpdatedEventArgs extends DecodedLogArgs {
    quoteSigner: string;
}
export interface IZeroExTransformedERC20EventArgs extends DecodedLogArgs {
    taker: string;
    inputToken: string;
    outputToken: string;
    inputTokenAmount: BigNumber;
    outputTokenAmount: BigNumber;
}
export interface IZeroExTransformerDeployerUpdatedEventArgs extends DecodedLogArgs {
    transformerDeployer: string;
}
export declare class IZeroExContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<IZeroExContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<IZeroExContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }): Promise<IZeroExContract>;
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
     * Execute a meta-transaction via `sender`. Privileged variant.
 * Only callable from within.
      * @param sender Who is executing the meta-transaction..
      * @param mtx The meta-transaction.
      * @param signature The signature by `mtx.signer`.
     */
    _executeMetaTransaction(sender: string, mtx: {
        signer: string;
        sender: string;
        minGasPrice: BigNumber;
        maxGasPrice: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        callData: string;
        value: BigNumber;
        feeToken: string;
        feeAmount: BigNumber;
    }, signature: string): ContractTxFunctionObj<string>;
    /**
     * Transfers ERC20 tokens from `owner` to `to`.
 * Only callable from within.
      * @param token The token to spend.
      * @param owner The owner of the tokens.
      * @param to The recipient of the tokens.
      * @param amount The amount of `token` to transfer.
     */
    _spendERC20Tokens(token: string, owner: string, to: string, amount: BigNumber): ContractTxFunctionObj<void>;
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
     * Execute multiple meta-transactions.
      * @param mtxs The meta-transactions.
      * @param signatures The signature by each respective `mtx.signer`.
     */
    batchExecuteMetaTransactions(mtxs: Array<{
        signer: string;
        sender: string;
        minGasPrice: BigNumber;
        maxGasPrice: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        callData: string;
        value: BigNumber;
        feeToken: string;
        feeAmount: BigNumber;
    }>, signatures: string[]): ContractTxFunctionObj<string[]>;
    /**
     * Deploy a new flash wallet instance and replace the current one with it.
 * Useful if we somehow break the current wallet instance.
 * Only callable by the owner.
     */
    createTransformWallet(): ContractTxFunctionObj<string>;
    /**
     * Execute a single meta-transaction.
      * @param mtx The meta-transaction.
      * @param signature The signature by `mtx.signer`.
     */
    executeMetaTransaction(mtx: {
        signer: string;
        sender: string;
        minGasPrice: BigNumber;
        maxGasPrice: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        callData: string;
        value: BigNumber;
        feeToken: string;
        feeAmount: BigNumber;
    }, signature: string): ContractTxFunctionObj<string>;
    /**
     * Register or replace a function.
      * @param selector The function selector.
      * @param impl The implementation contract for the function.
     */
    extend(selector: string, impl: string): ContractTxFunctionObj<void>;
    /**
     * Get the address of the allowance target.
     */
    getAllowanceTarget(): ContractTxFunctionObj<string>;
    /**
     * Get the implementation contract of a registered function.
      * @param selector The function selector.
     */
    getFunctionImplementation(selector: string): ContractTxFunctionObj<string>;
    /**
     * Returns the address of the liquidity provider for a market given
 * (xAsset, yAsset), or reverts if pool does not exist.
      * @param xAsset First asset managed by the liquidity provider.
      * @param yAsset Second asset managed by the liquidity provider.
     */
    getLiquidityProviderForMarket(xAsset: string, yAsset: string): ContractTxFunctionObj<string>;
    /**
     * Get the block at which a meta-transaction has been executed.
      * @param mtx The meta-transaction.
     */
    getMetaTransactionExecutedBlock(mtx: {
        signer: string;
        sender: string;
        minGasPrice: BigNumber;
        maxGasPrice: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        callData: string;
        value: BigNumber;
        feeToken: string;
        feeAmount: BigNumber;
    }): ContractTxFunctionObj<BigNumber>;
    /**
     * Get the EIP712 hash of a meta-transaction.
      * @param mtx The meta-transaction.
     */
    getMetaTransactionHash(mtx: {
        signer: string;
        sender: string;
        minGasPrice: BigNumber;
        maxGasPrice: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        callData: string;
        value: BigNumber;
        feeToken: string;
        feeAmount: BigNumber;
    }): ContractTxFunctionObj<string>;
    /**
     * Get the block at which a meta-transaction hash has been executed.
      * @param mtxHash The meta-transaction hash.
     */
    getMetaTransactionHashExecutedBlock(mtxHash: string): ContractTxFunctionObj<BigNumber>;
    /**
     * Return the optional signer for `transformERC20()` calldata.
     */
    getQuoteSigner(): ContractTxFunctionObj<string>;
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
     * Gets the maximum amount of an ERC20 token `token` that can be
 * pulled from `owner`.
      * @param token The token to spend.
      * @param owner The owner of the tokens.
     */
    getSpendableERC20BalanceOf(token: string, owner: string): ContractTxFunctionObj<BigNumber>;
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
     * Check that `hash` was signed by `signer` given `signature`.
      * @param hash The hash that was signed.
      * @param signer The signer of the hash.
      * @param signature The signature. The last byte of this signature should
     *      be a member of the `SignatureType` enum.
     */
    isValidHashSignature(hash: string, signer: string, signature: string): ContractTxFunctionObj<boolean>;
    /**
     * Execute a migration function in the context of the ZeroEx contract.
 * The result of the function being called should be the magic bytes
 * 0x2c64c5ef (`keccack('MIGRATE_SUCCESS')`). Only callable by the owner.
 * The owner will be temporarily set to `address(this)` inside the call.
 * Before returning, the owner will be set to `newOwner`.
      * @param target The migrator contract address.
      * @param data The call data.
      * @param newOwner The address of the new owner.
     */
    migrate(target: string, data: string, newOwner: string): ContractTxFunctionObj<void>;
    /**
     * The owner of this contract.
     */
    owner(): ContractTxFunctionObj<string>;
    /**
     * Roll back to a prior implementation of a function.
      * @param selector The function selector.
      * @param targetImpl The address of an older implementation of the function.
     */
    rollback(selector: string, targetImpl: string): ContractTxFunctionObj<void>;
    sellToLiquidityProvider(makerToken: string, takerToken: string, recipient: string, sellAmount: BigNumber, minBuyAmount: BigNumber): ContractTxFunctionObj<BigNumber>;
    /**
     * Efficiently sell directly to uniswap/sushiswap.
      * @param tokens Sell path.
      * @param sellAmount of `tokens[0]` Amount to sell.
      * @param minBuyAmount Minimum amount of `tokens[-1]` to buy.
      * @param isSushi Use sushiswap if true.
     */
    sellToUniswap(tokens: string[], sellAmount: BigNumber, minBuyAmount: BigNumber, isSushi: boolean): ContractTxFunctionObj<BigNumber>;
    /**
     * Sets address of the liquidity provider for a market given
 * (xAsset, yAsset).
      * @param xAsset First asset managed by the liquidity provider.
      * @param yAsset Second asset managed by the liquidity provider.
      * @param providerAddress Address of the liquidity provider.
     */
    setLiquidityProviderForMarket(xAsset: string, yAsset: string, providerAddress: string): ContractTxFunctionObj<void>;
    /**
     * Replace the optional signer for `transformERC20()` calldata.
 * Only callable by the owner.
      * @param quoteSigner The address of the new calldata signer.
     */
    setQuoteSigner(quoteSigner: string): ContractTxFunctionObj<void>;
    /**
     * Replace the allowed deployer for transformers.
 * Only callable by the owner.
      * @param transformerDeployer The address of the new trusted deployer
     *     for transformers.
     */
    setTransformerDeployer(transformerDeployer: string): ContractTxFunctionObj<void>;
    /**
     * Transfers ownership of the contract to a new address.
      * @param newOwner The address that will become the owner.
     */
    transferOwnership(newOwner: string): ContractTxFunctionObj<void>;
    /**
     * Executes a series of transformations to convert an ERC20 `inputToken`
 * to an ERC20 `outputToken`.
      * @param inputToken The token being provided by the sender.        If
     *     `0xeee...`, ETH is implied and should be provided with the call.`
      * @param outputToken The token to be acquired by the sender.        `0xeee...`
     *     implies ETH.
      * @param inputTokenAmount The amount of `inputToken` to take from the sender.
      * @param minOutputTokenAmount The minimum amount of `outputToken` the sender
     *          must receive for the entire transformation to succeed.
      * @param transformations The transformations to execute on the token
     *     balance(s)        in sequence.
     */
    transformERC20(inputToken: string, outputToken: string, inputTokenAmount: BigNumber, minOutputTokenAmount: BigNumber, transformations: Array<{
        deploymentNonce: number | BigNumber;
        data: string;
    }>): ContractTxFunctionObj<BigNumber>;
    /**
     * Validate that `hash` was signed by `signer` given `signature`.
 * Reverts otherwise.
      * @param hash The hash that was signed.
      * @param signer The signer of the hash.
      * @param signature The signature. The last byte of this signature should
     *      be a member of the `SignatureType` enum.
     */
    validateHashSignature(hash: string, signer: string, signature: string): ContractTxFunctionObj<void>;
    /**
     * Subscribe to an event type emitted by the IZeroEx contract.
     * @param eventName The IZeroEx contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends IZeroExEventArgs>(eventName: IZeroExEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The IZeroEx contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends IZeroExEventArgs>(eventName: IZeroExEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=i_zero_ex.d.ts.map