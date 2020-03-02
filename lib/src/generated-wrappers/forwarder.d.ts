import { ContractFunctionObj, ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type ForwarderEventArgs = ForwarderOwnershipTransferredEventArgs;
export declare enum ForwarderEvents {
    OwnershipTransferred = "OwnershipTransferred"
}
export interface ForwarderOwnershipTransferredEventArgs extends DecodedLogArgs {
    previousOwner: string;
    newOwner: string;
}
export declare class ForwarderContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }, _exchange: string, _exchangeV2: string, _weth: string): Promise<ForwarderContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }, _exchange: string, _exchangeV2: string, _weth: string): Promise<ForwarderContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, _exchange: string, _exchangeV2: string, _weth: string): Promise<ForwarderContract>;
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
    ERC1155_BATCH_RECEIVED(): ContractFunctionObj<string>;
    ERC1155_RECEIVED(): ContractFunctionObj<string>;
    EXCHANGE_V2_ORDER_ID(): ContractFunctionObj<string>;
    /**
     * Approves the respective proxy for a given asset to transfer tokens on the Forwarder contract's behalf.
     * This is necessary because an order fee denominated in the maker asset (i.e. a percentage fee) is sent by the
     * Forwarder contract to the fee recipient.
     * This method needs to be called before forwarding orders of a maker asset that hasn't
     * previously been approved.
     * @param assetData Byte array encoded for the respective asset proxy.
     */
    approveMakerAssetProxy(assetData: string): ContractTxFunctionObj<void>;
    /**
     * Attempt to buy makerAssetBuyAmount of makerAsset by selling ETH provided with transaction.
     * The Forwarder may *fill* more than makerAssetBuyAmount of the makerAsset so that it can
     * pay takerFees where takerFeeAssetData == makerAssetData (i.e. percentage fees).
     * Any ETH not spent will be refunded to sender.
     * @param orders Array of order specifications used containing desired
     *     makerAsset and WETH as takerAsset.
     * @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
     * @param signatures Proofs that orders have been created by makers.
     * @param ethFeeAmounts Amounts of ETH, denominated in Wei, that are paid to
     *     corresponding feeRecipients.
     * @param feeRecipients Addresses that will receive ETH when orders are filled.
     * @returns wethSpentAmount Amount of WETH spent on the given set of orders.makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.
     */
    marketBuyOrdersWithEth(orders: Array<{
        makerAddress: string;
        takerAddress: string;
        feeRecipientAddress: string;
        senderAddress: string;
        makerAssetAmount: BigNumber;
        takerAssetAmount: BigNumber;
        makerFee: BigNumber;
        takerFee: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        makerAssetData: string;
        takerAssetData: string;
        makerFeeAssetData: string;
        takerFeeAssetData: string;
    }>, makerAssetBuyAmount: BigNumber, signatures: string[], ethFeeAmounts: BigNumber[], feeRecipients: string[]): ContractTxFunctionObj<[BigNumber, BigNumber]>;
    /**
     * Purchases as much of orders' makerAssets as possible by selling as much of the ETH value sent
     * as possible, accounting for order and forwarder fees.
     * @param orders Array of order specifications used containing desired
     *     makerAsset and WETH as takerAsset.
     * @param signatures Proofs that orders have been created by makers.
     * @param ethFeeAmounts Amounts of ETH, denominated in Wei, that are paid to
     *     corresponding feeRecipients.
     * @param feeRecipients Addresses that will receive ETH when orders are filled.
     * @returns wethSpentAmount Amount of WETH spent on the given set of orders.makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.
     */
    marketSellOrdersWithEth(orders: Array<{
        makerAddress: string;
        takerAddress: string;
        feeRecipientAddress: string;
        senderAddress: string;
        makerAssetAmount: BigNumber;
        takerAssetAmount: BigNumber;
        makerFee: BigNumber;
        takerFee: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        makerAssetData: string;
        takerAssetData: string;
        makerFeeAssetData: string;
        takerFeeAssetData: string;
    }>, signatures: string[], ethFeeAmounts: BigNumber[], feeRecipients: string[]): ContractTxFunctionObj<[BigNumber, BigNumber]>;
    /**
     * The smart contract calls this function on the recipient after a `safeTransferFrom`. This function MAY throw to revert and reject the transfer. Return of other than the magic value MUST result in the transaction being reverted Note: the contract address is always the message sender
     * @param operator The address which called `safeTransferFrom` function
     * @param from The address which previously owned the token
     * @param ids An array containing ids of each token being transferred
     * @param values An array containing amounts of each token being transferred
     * @param data Additional data with no specified format
     * @returns &#x60;bytes4(keccak256(&quot;onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)&quot;))&#x60;
     */
    onERC1155BatchReceived(operator: string, from: string, ids: BigNumber[], values: BigNumber[], data: string): ContractTxFunctionObj<string>;
    /**
     * The smart contract calls this function on the recipient after a `safeTransferFrom`. This function MAY throw to revert and reject the transfer. Return of other than the magic value MUST result in the transaction being reverted Note: the contract address is always the message sender
     * @param operator The address which called `safeTransferFrom` function
     * @param from The address which previously owned the token
     * @param id An array containing the ids of the token being transferred
     * @param value An array containing the amount of tokens being transferred
     * @param data Additional data with no specified format
     * @returns &#x60;bytes4(keccak256(&quot;onERC1155Received(address,address,uint256,uint256,bytes)&quot;))&#x60;
     */
    onERC1155Received(operator: string, from: string, id: BigNumber, value: BigNumber, data: string): ContractTxFunctionObj<string>;
    owner(): ContractFunctionObj<string>;
    /**
     * Change the owner of this contract.
     * @param newOwner New owner address.
     */
    transferOwnership(newOwner: string): ContractTxFunctionObj<void>;
    /**
     * Withdraws assets from this contract. It may be used by the owner to withdraw assets
     * that were accidentally sent to this contract.
     * @param assetData Byte array encoded for the respective asset proxy.
     * @param amount Amount of the asset to withdraw.
     */
    withdrawAsset(assetData: string, amount: BigNumber): ContractTxFunctionObj<void>;
    /**
     * Subscribe to an event type emitted by the Forwarder contract.
     * @param eventName The Forwarder contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends ForwarderEventArgs>(eventName: ForwarderEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The Forwarder contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends ForwarderEventArgs>(eventName: ForwarderEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=forwarder.d.ts.map