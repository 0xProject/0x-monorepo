import { ContractFunctionObj, ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type ExchangeEventArgs = ExchangeAssetProxyRegisteredEventArgs | ExchangeCancelEventArgs | ExchangeCancelUpToEventArgs | ExchangeFillEventArgs | ExchangeOwnershipTransferredEventArgs | ExchangeProtocolFeeCollectorAddressEventArgs | ExchangeProtocolFeeMultiplierEventArgs | ExchangeSignatureValidatorApprovalEventArgs | ExchangeTransactionExecutionEventArgs;
export declare enum ExchangeEvents {
    AssetProxyRegistered = "AssetProxyRegistered",
    Cancel = "Cancel",
    CancelUpTo = "CancelUpTo",
    Fill = "Fill",
    OwnershipTransferred = "OwnershipTransferred",
    ProtocolFeeCollectorAddress = "ProtocolFeeCollectorAddress",
    ProtocolFeeMultiplier = "ProtocolFeeMultiplier",
    SignatureValidatorApproval = "SignatureValidatorApproval",
    TransactionExecution = "TransactionExecution"
}
export interface ExchangeAssetProxyRegisteredEventArgs extends DecodedLogArgs {
    id: string;
    assetProxy: string;
}
export interface ExchangeCancelEventArgs extends DecodedLogArgs {
    makerAddress: string;
    feeRecipientAddress: string;
    makerAssetData: string;
    takerAssetData: string;
    senderAddress: string;
    orderHash: string;
}
export interface ExchangeCancelUpToEventArgs extends DecodedLogArgs {
    makerAddress: string;
    orderSenderAddress: string;
    orderEpoch: BigNumber;
}
export interface ExchangeFillEventArgs extends DecodedLogArgs {
    makerAddress: string;
    feeRecipientAddress: string;
    makerAssetData: string;
    takerAssetData: string;
    makerFeeAssetData: string;
    takerFeeAssetData: string;
    orderHash: string;
    takerAddress: string;
    senderAddress: string;
    makerAssetFilledAmount: BigNumber;
    takerAssetFilledAmount: BigNumber;
    makerFeePaid: BigNumber;
    takerFeePaid: BigNumber;
    protocolFeePaid: BigNumber;
}
export interface ExchangeOwnershipTransferredEventArgs extends DecodedLogArgs {
    previousOwner: string;
    newOwner: string;
}
export interface ExchangeProtocolFeeCollectorAddressEventArgs extends DecodedLogArgs {
    oldProtocolFeeCollector: string;
    updatedProtocolFeeCollector: string;
}
export interface ExchangeProtocolFeeMultiplierEventArgs extends DecodedLogArgs {
    oldProtocolFeeMultiplier: BigNumber;
    updatedProtocolFeeMultiplier: BigNumber;
}
export interface ExchangeSignatureValidatorApprovalEventArgs extends DecodedLogArgs {
    signerAddress: string;
    validatorAddress: string;
    isApproved: boolean;
}
export interface ExchangeTransactionExecutionEventArgs extends DecodedLogArgs {
    transactionHash: string;
}
export declare class ExchangeContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }, chainId: BigNumber): Promise<ExchangeContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }, chainId: BigNumber): Promise<ExchangeContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, chainId: BigNumber): Promise<ExchangeContract>;
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
    EIP1271_MAGIC_VALUE(): ContractFunctionObj<string>;
    EIP712_EXCHANGE_DOMAIN_HASH(): ContractFunctionObj<string>;
    allowedValidators(index_0: string, index_1: string): ContractFunctionObj<boolean>;
    /**
     * Executes multiple calls of cancelOrder.
     * @param orders Array of order specifications.
     */
    batchCancelOrders(orders: Array<{
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
    }>): ContractTxFunctionObj<void>;
    /**
     * Executes a batch of Exchange method calls in the context of signer(s).
     * @param transactions Array of 0x transaction structures.
     * @param signatures Array of proofs that transactions have been signed by
     *     signer(s).
     * @returns returnData Array containing ABI encoded return data for each of the underlying Exchange function calls.
     */
    batchExecuteTransactions(transactions: Array<{
        salt: BigNumber;
        expirationTimeSeconds: BigNumber;
        gasPrice: BigNumber;
        signerAddress: string;
        data: string;
    }>, signatures: string[]): ContractTxFunctionObj<string[]>;
    /**
     * Executes multiple calls of fillOrKillOrder.
     * @param orders Array of order specifications.
     * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
     *     in orders.
     * @param signatures Proofs that orders have been created by makers.
     * @returns fillResults Array of amounts filled and fees paid by makers and taker.
     */
    batchFillOrKillOrders(orders: Array<{
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
    }>, takerAssetFillAmounts: BigNumber[], signatures: string[]): ContractTxFunctionObj<Array<{
        makerAssetFilledAmount: BigNumber;
        takerAssetFilledAmount: BigNumber;
        makerFeePaid: BigNumber;
        takerFeePaid: BigNumber;
        protocolFeePaid: BigNumber;
    }>>;
    /**
     * Executes multiple calls of fillOrder.
     * @param orders Array of order specifications.
     * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
     *     in orders.
     * @param signatures Proofs that orders have been created by makers.
     * @returns fillResults Array of amounts filled and fees paid by makers and taker.
     */
    batchFillOrders(orders: Array<{
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
    }>, takerAssetFillAmounts: BigNumber[], signatures: string[]): ContractTxFunctionObj<Array<{
        makerAssetFilledAmount: BigNumber;
        takerAssetFilledAmount: BigNumber;
        makerFeePaid: BigNumber;
        takerFeePaid: BigNumber;
        protocolFeePaid: BigNumber;
    }>>;
    /**
     * Executes multiple calls of fillOrder. If any fill reverts, the error is caught and ignored.
     * @param orders Array of order specifications.
     * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
     *     in orders.
     * @param signatures Proofs that orders have been created by makers.
     * @returns fillResults Array of amounts filled and fees paid by makers and taker.
     */
    batchFillOrdersNoThrow(orders: Array<{
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
    }>, takerAssetFillAmounts: BigNumber[], signatures: string[]): ContractTxFunctionObj<Array<{
        makerAssetFilledAmount: BigNumber;
        takerAssetFilledAmount: BigNumber;
        makerFeePaid: BigNumber;
        takerFeePaid: BigNumber;
        protocolFeePaid: BigNumber;
    }>>;
    /**
     * Match complementary orders that have a profitable spread.
     * Each order is filled at their respective price point, and
     * the matcher receives a profit denominated in the left maker asset.
     * @param leftOrders Set of orders with the same maker / taker asset.
     * @param rightOrders Set of orders to match against `leftOrders`
     * @param leftSignatures Proof that left orders were created by the left
     *     makers.
     * @param rightSignatures Proof that right orders were created by the right
     *     makers.
     * @returns batchMatchedFillResults Amounts filled and profit generated.
     */
    batchMatchOrders(leftOrders: Array<{
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
    }>, rightOrders: Array<{
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
    }>, leftSignatures: string[], rightSignatures: string[]): ContractTxFunctionObj<{
        left: Array<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
            protocolFeePaid: BigNumber;
        }>;
        right: Array<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
            protocolFeePaid: BigNumber;
        }>;
        profitInLeftMakerAsset: BigNumber;
        profitInRightMakerAsset: BigNumber;
    }>;
    /**
     * Match complementary orders that have a profitable spread.
     * Each order is maximally filled at their respective price point, and
     * the matcher receives a profit denominated in either the left maker asset,
     * right maker asset, or a combination of both.
     * @param leftOrders Set of orders with the same maker / taker asset.
     * @param rightOrders Set of orders to match against `leftOrders`
     * @param leftSignatures Proof that left orders were created by the left
     *     makers.
     * @param rightSignatures Proof that right orders were created by the right
     *     makers.
     * @returns batchMatchedFillResults Amounts filled and profit generated.
     */
    batchMatchOrdersWithMaximalFill(leftOrders: Array<{
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
    }>, rightOrders: Array<{
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
    }>, leftSignatures: string[], rightSignatures: string[]): ContractTxFunctionObj<{
        left: Array<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
            protocolFeePaid: BigNumber;
        }>;
        right: Array<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
            protocolFeePaid: BigNumber;
        }>;
        profitInLeftMakerAsset: BigNumber;
        profitInRightMakerAsset: BigNumber;
    }>;
    /**
     * After calling, the order can not be filled anymore.
     * @param order Order struct containing order specifications.
     */
    cancelOrder(order: {
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
    }): ContractTxFunctionObj<void>;
    /**
     * Cancels all orders created by makerAddress with a salt less than or equal to the targetOrderEpoch
     * and senderAddress equal to msg.sender (or null address if msg.sender == makerAddress).
     * @param targetOrderEpoch Orders created with a salt less or equal to this
     *     value will be cancelled.
     */
    cancelOrdersUpTo(targetOrderEpoch: BigNumber): ContractTxFunctionObj<void>;
    cancelled(index_0: string): ContractFunctionObj<boolean>;
    currentContextAddress(): ContractFunctionObj<string>;
    /**
     * Sets the protocolFeeCollector contract address to 0.
     * Only callable by owner.
     */
    detachProtocolFeeCollector(): ContractTxFunctionObj<void>;
    /**
     * Executes an Exchange method call in the context of signer.
     * @param transaction 0x transaction structure.
     * @param signature Proof that transaction has been signed by signer.
     * @returns ABI encoded return data of the underlying Exchange function call.
     */
    executeTransaction(transaction: {
        salt: BigNumber;
        expirationTimeSeconds: BigNumber;
        gasPrice: BigNumber;
        signerAddress: string;
        data: string;
    }, signature: string): ContractTxFunctionObj<string>;
    /**
     * Fills the input order. Reverts if exact `takerAssetFillAmount` not filled.
     * @param order Order struct containing order specifications.
     * @param takerAssetFillAmount Desired amount of takerAsset to sell.
     * @param signature Proof that order has been created by maker.
     * @returns fillResults Amounts filled and fees paid.
     */
    fillOrKillOrder(order: {
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
    }, takerAssetFillAmount: BigNumber, signature: string): ContractTxFunctionObj<{
        makerAssetFilledAmount: BigNumber;
        takerAssetFilledAmount: BigNumber;
        makerFeePaid: BigNumber;
        takerFeePaid: BigNumber;
        protocolFeePaid: BigNumber;
    }>;
    /**
     * Fills the input order.
     * @param order Order struct containing order specifications.
     * @param takerAssetFillAmount Desired amount of takerAsset to sell.
     * @param signature Proof that order has been created by maker.
     * @returns fillResults Amounts filled and fees paid by maker and taker.
     */
    fillOrder(order: {
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
    }, takerAssetFillAmount: BigNumber, signature: string): ContractTxFunctionObj<{
        makerAssetFilledAmount: BigNumber;
        takerAssetFilledAmount: BigNumber;
        makerFeePaid: BigNumber;
        takerFeePaid: BigNumber;
        protocolFeePaid: BigNumber;
    }>;
    filled(index_0: string): ContractFunctionObj<BigNumber>;
    /**
     * Gets an asset proxy.
     * @param assetProxyId Id of the asset proxy.
     * @returns assetProxy The asset proxy address registered to assetProxyId. Returns 0x0 if no proxy is registered.
     */
    getAssetProxy(assetProxyId: string): ContractFunctionObj<string>;
    /**
     * Gets information about an order: status, hash, and amount filled.
     * @param order Order to gather information on.
     * @returns orderInfo Information about the order and its state.         See LibOrder.OrderInfo for a complete description.
     */
    getOrderInfo(order: {
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
    }): ContractFunctionObj<{
        orderStatus: number;
        orderHash: string;
        orderTakerAssetFilledAmount: BigNumber;
    }>;
    /**
     * Verifies that a hash has been signed by the given signer.
     * @param hash Any 32-byte hash.
     * @param signerAddress Address that should have signed the given hash.
     * @param signature Proof that the hash has been signed by signer.
     * @returns isValid &#x60;true&#x60; if the signature is valid for the given hash and signer.
     */
    isValidHashSignature(hash: string, signerAddress: string, signature: string): ContractFunctionObj<boolean>;
    /**
     * Verifies that a signature for an order is valid.
     * @param order The order.
     * @param signature Proof that the order has been signed by signer.
     * @returns isValid &#x60;true&#x60; if the signature is valid for the given order and signer.
     */
    isValidOrderSignature(order: {
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
    }, signature: string): ContractFunctionObj<boolean>;
    /**
     * Verifies that a signature for a transaction is valid.
     * @param transaction The transaction.
     * @param signature Proof that the order has been signed by signer.
     * @returns isValid &#x60;true&#x60; if the signature is valid for the given transaction and signer.
     */
    isValidTransactionSignature(transaction: {
        salt: BigNumber;
        expirationTimeSeconds: BigNumber;
        gasPrice: BigNumber;
        signerAddress: string;
        data: string;
    }, signature: string): ContractFunctionObj<boolean>;
    /**
     * Calls marketBuyOrdersNoThrow then reverts if < makerAssetFillAmount has been bought.
     * NOTE: This function does not enforce that the makerAsset is the same for each order.
     * @param orders Array of order specifications.
     * @param makerAssetFillAmount Minimum amount of makerAsset to buy.
     * @param signatures Proofs that orders have been signed by makers.
     * @returns fillResults Amounts filled and fees paid by makers and taker.
     */
    marketBuyOrdersFillOrKill(orders: Array<{
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
    }>, makerAssetFillAmount: BigNumber, signatures: string[]): ContractTxFunctionObj<{
        makerAssetFilledAmount: BigNumber;
        takerAssetFilledAmount: BigNumber;
        makerFeePaid: BigNumber;
        takerFeePaid: BigNumber;
        protocolFeePaid: BigNumber;
    }>;
    /**
     * Executes multiple calls of fillOrder until total amount of makerAsset is bought by taker.
     * If any fill reverts, the error is caught and ignored.
     * NOTE: This function does not enforce that the makerAsset is the same for each order.
     * @param orders Array of order specifications.
     * @param makerAssetFillAmount Desired amount of makerAsset to buy.
     * @param signatures Proofs that orders have been signed by makers.
     * @returns fillResults Amounts filled and fees paid by makers and taker.
     */
    marketBuyOrdersNoThrow(orders: Array<{
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
    }>, makerAssetFillAmount: BigNumber, signatures: string[]): ContractTxFunctionObj<{
        makerAssetFilledAmount: BigNumber;
        takerAssetFilledAmount: BigNumber;
        makerFeePaid: BigNumber;
        takerFeePaid: BigNumber;
        protocolFeePaid: BigNumber;
    }>;
    /**
     * Calls marketSellOrdersNoThrow then reverts if < takerAssetFillAmount has been sold.
     * NOTE: This function does not enforce that the takerAsset is the same for each order.
     * @param orders Array of order specifications.
     * @param takerAssetFillAmount Minimum amount of takerAsset to sell.
     * @param signatures Proofs that orders have been signed by makers.
     * @returns fillResults Amounts filled and fees paid by makers and taker.
     */
    marketSellOrdersFillOrKill(orders: Array<{
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
    }>, takerAssetFillAmount: BigNumber, signatures: string[]): ContractTxFunctionObj<{
        makerAssetFilledAmount: BigNumber;
        takerAssetFilledAmount: BigNumber;
        makerFeePaid: BigNumber;
        takerFeePaid: BigNumber;
        protocolFeePaid: BigNumber;
    }>;
    /**
     * Executes multiple calls of fillOrder until total amount of takerAsset is sold by taker.
     * If any fill reverts, the error is caught and ignored.
     * NOTE: This function does not enforce that the takerAsset is the same for each order.
     * @param orders Array of order specifications.
     * @param takerAssetFillAmount Desired amount of takerAsset to sell.
     * @param signatures Proofs that orders have been signed by makers.
     * @returns fillResults Amounts filled and fees paid by makers and taker.
     */
    marketSellOrdersNoThrow(orders: Array<{
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
    }>, takerAssetFillAmount: BigNumber, signatures: string[]): ContractTxFunctionObj<{
        makerAssetFilledAmount: BigNumber;
        takerAssetFilledAmount: BigNumber;
        makerFeePaid: BigNumber;
        takerFeePaid: BigNumber;
        protocolFeePaid: BigNumber;
    }>;
    /**
     * Match two complementary orders that have a profitable spread.
     * Each order is filled at their respective price point. However, the calculations are
     * carried out as though the orders are both being filled at the right order's price point.
     * The profit made by the left order goes to the taker (who matched the two orders).
     * @param leftOrder First order to match.
     * @param rightOrder Second order to match.
     * @param leftSignature Proof that order was created by the left maker.
     * @param rightSignature Proof that order was created by the right maker.
     * @returns matchedFillResults Amounts filled and fees paid by maker and taker of matched orders.
     */
    matchOrders(leftOrder: {
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
    }, rightOrder: {
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
    }, leftSignature: string, rightSignature: string): ContractTxFunctionObj<{
        left: {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
            protocolFeePaid: BigNumber;
        };
        right: {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
            protocolFeePaid: BigNumber;
        };
        profitInLeftMakerAsset: BigNumber;
        profitInRightMakerAsset: BigNumber;
    }>;
    /**
     * Match two complementary orders that have a profitable spread.
     * Each order is maximally filled at their respective price point, and
     * the matcher receives a profit denominated in either the left maker asset,
     * right maker asset, or a combination of both.
     * @param leftOrder First order to match.
     * @param rightOrder Second order to match.
     * @param leftSignature Proof that order was created by the left maker.
     * @param rightSignature Proof that order was created by the right maker.
     * @returns matchedFillResults Amounts filled by maker and taker of matched orders.
     */
    matchOrdersWithMaximalFill(leftOrder: {
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
    }, rightOrder: {
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
    }, leftSignature: string, rightSignature: string): ContractTxFunctionObj<{
        left: {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
            protocolFeePaid: BigNumber;
        };
        right: {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
            protocolFeePaid: BigNumber;
        };
        profitInLeftMakerAsset: BigNumber;
        profitInRightMakerAsset: BigNumber;
    }>;
    orderEpoch(index_0: string, index_1: string): ContractFunctionObj<BigNumber>;
    owner(): ContractFunctionObj<string>;
    /**
     * Approves a hash on-chain.
     * After presigning a hash, the preSign signature type will become valid for that hash and signer.
     * @param hash Any 32-byte hash.
     */
    preSign(hash: string): ContractTxFunctionObj<void>;
    preSigned(index_0: string, index_1: string): ContractFunctionObj<boolean>;
    protocolFeeCollector(): ContractFunctionObj<string>;
    protocolFeeMultiplier(): ContractFunctionObj<BigNumber>;
    /**
     * Registers an asset proxy to its asset proxy id.
     * Once an asset proxy is registered, it cannot be unregistered.
     * @param assetProxy Address of new asset proxy to register.
     */
    registerAssetProxy(assetProxy: string): ContractTxFunctionObj<void>;
    /**
     * Allows the owner to update the protocolFeeCollector address.
     * @param updatedProtocolFeeCollector The updated protocolFeeCollector contract
     *     address.
     */
    setProtocolFeeCollectorAddress(updatedProtocolFeeCollector: string): ContractTxFunctionObj<void>;
    /**
     * Allows the owner to update the protocol fee multiplier.
     * @param updatedProtocolFeeMultiplier The updated protocol fee multiplier.
     */
    setProtocolFeeMultiplier(updatedProtocolFeeMultiplier: BigNumber): ContractTxFunctionObj<void>;
    /**
     * Approves/unnapproves a Validator contract to verify signatures on signer's behalf
     * using the `Validator` signature type.
     * @param validatorAddress Address of Validator contract.
     * @param approval Approval or disapproval of  Validator contract.
     */
    setSignatureValidatorApproval(validatorAddress: string, approval: boolean): ContractTxFunctionObj<void>;
    /**
     * This function may be used to simulate any amount of transfers As they would occur through the Exchange contract. Note that this function will always revert, even if all transfers are successful. However, it may be used with eth_call or with a try/catch pattern in order to simulate the results of the transfers.
     * @param assetData Array of asset details, each encoded per the AssetProxy
     *     contract specification.
     * @param fromAddresses Array containing the `from` addresses that correspond
     *     with each transfer.
     * @param toAddresses Array containing the `to` addresses that correspond with
     *     each transfer.
     * @param amounts Array containing the amounts that correspond to each
     *     transfer.
     * @returns This function does not return a value. However, it will always revert with &#x60;Error(&quot;TRANSFERS_SUCCESSFUL&quot;)&#x60; if all of the transfers were successful.
     */
    simulateDispatchTransferFromCalls(assetData: string[], fromAddresses: string[], toAddresses: string[], amounts: BigNumber[]): ContractTxFunctionObj<void>;
    transactionsExecuted(index_0: string): ContractFunctionObj<boolean>;
    /**
     * Change the owner of this contract.
     * @param newOwner New owner address.
     */
    transferOwnership(newOwner: string): ContractTxFunctionObj<void>;
    /**
     * Subscribe to an event type emitted by the Exchange contract.
     * @param eventName The Exchange contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends ExchangeEventArgs>(eventName: ExchangeEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The Exchange contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends ExchangeEventArgs>(eventName: ExchangeEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=exchange.d.ts.map