import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { MethodAbi } from 'ethereum-types';

export interface OrderPrunerOpts {
    expiryBufferMs: number;
}
/**
 * makerAssetData: The assetData representing the desired makerAsset.
 * takerAssetData: The assetData representing the desired takerAsset.
 */
export interface OrderProviderRequest {
    makerAssetData: string;
    takerAssetData: string;
}

/**
 * A normal SignedOrder with one extra optional property `remainingFillableMakerAssetAmount`
 * remainingFillableMakerAssetAmount: The amount of the makerAsset that is available to be filled
 */
export interface PrunedSignedOrder extends SignedOrder {
    remainingMakerAssetAmount: BigNumber;
    remainingTakerAssetAmount: BigNumber;
    remainingTakerFee: BigNumber;
}

/**
 * Represents the metadata to call a smart contract with calldata.
 * calldataHexString: The hexstring of the calldata.
 * methodAbi: The ABI of the smart contract method to call.
 * toAddress: The contract address to call.
 * ethAmount: If provided, the eth amount in wei to send with the smart contract call.
 */
export interface CalldataInfo {
    calldataHexString: string;
    methodAbi: MethodAbi;
    toAddress: string;
    ethAmount?: BigNumber;
}

/**
 * Represents the metadata to call a smart contract with parameters.
 * params: The metadata object containing all the input parameters of a smart contract call.
 * toAddress: The contract address to call.
 * ethAmount: If provided, the eth amount in wei to send with the smart contract call.
 * methodAbi: The ABI of the smart contract method to call with params.
 */
export interface SmartContractParamsInfo<T> {
    params: T;
    toAddress: string;
    ethAmount?: BigNumber;
    methodAbi: MethodAbi;
}

/**
 * orders: An array of objects conforming to SignedOrder. These orders can be used to cover the requested assetBuyAmount plus slippage.
 * signatures: An array of signatures that attest that the maker of the orders in fact made the orders.
 */
export interface SmartContractParamsBase {
    orders: SignedOrder[];
    signatures: string[];
}

/**
 * makerAssetFillAmount: The amount of makerAsset to swap for.
 * type: String specifiying which market operation will be performed with the provided parameters. (In this case a market buy operation)
 */
export interface ExchangeMarketBuySmartContractParams extends SmartContractParamsBase {
    makerAssetFillAmount: BigNumber;
    type: MarketOperation.Buy;
}

/**
 * takerAssetFillAmount: The amount of takerAsset swapped for makerAsset.
 * type: String specifiying which market operation will be performed with the provided parameters. (In this case a market sell operation)
 */
export interface ExchangeMarketSellSmartContractParams extends SmartContractParamsBase {
    takerAssetFillAmount: BigNumber;
    type: MarketOperation.Sell;
}

/**
 * Represents the varying smart contracts that can consume a valid swap quote
 */
export enum ExtensionContractType {
    Forwarder = 'FORWARDER',
    None = 'NONE',
}

/**
 * Represents all the parameters to interface with 0x exchange contracts' marketSell and marketBuy functions.
 */
export type ExchangeSmartContractParams = ExchangeMarketBuySmartContractParams | ExchangeMarketSellSmartContractParams;

/**
 * feePercentage: Optional affiliate fee percentage used to calculate the eth amount paid to fee recipient.
 * feeRecipient: The address where affiliate fees are sent. Defaults to null address (0x000...000).
 */
export interface ForwarderSmartContractParamsBase {
    feePercentage: BigNumber;
    feeRecipient: string;
}

export interface ForwarderMarketBuySmartContractParams
    extends ExchangeMarketBuySmartContractParams,
        ForwarderSmartContractParamsBase {}

// Temporary fix until typescript is upgraded to ^3.5
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface ForwarderMarketSellSmartContractParams
    extends Omit<ExchangeMarketSellSmartContractParams, 'takerAssetFillAmount'>,
        ForwarderSmartContractParamsBase {}

/**
 * Represents all the parameters to interface with 0x forwarder extension contract marketSell and marketBuy functions.
 */
export type ForwarderSmartContractParams =
    | ForwarderMarketBuySmartContractParams
    | ForwarderMarketSellSmartContractParams;

/**
 * Object containing all the parameters to interface with 0x exchange contracts' marketSell and marketBuy functions.
 */
export type SmartContractParams = ForwarderSmartContractParams | ExchangeSmartContractParams;

/**
 * Interface that varying SwapQuoteConsumers adhere to (exchange consumer, router consumer, forwarder consumer, coordinator consumer)
 * getCalldataOrThrow: Get CalldataInfo to swap for tokens with provided SwapQuote. Throws if invalid SwapQuote is provided.
 * getSmartContractParamsOrThrow: Get SmartContractParamsInfo to swap for tokens with provided SwapQuote. Throws if invalid SwapQuote is provided.
 * executeSwapQuoteOrThrowAsync: Executes a web3 transaction to swap for tokens with provided SwapQuote. Throws if invalid SwapQuote is provided.
 */
export interface SwapQuoteConsumerBase<T> {
    getCalldataOrThrowAsync(quote: SwapQuote, opts: Partial<SwapQuoteGetOutputOptsBase>): Promise<CalldataInfo>;
    getSmartContractParamsOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOptsBase>,
    ): Promise<SmartContractParamsInfo<T>>;
    executeSwapQuoteOrThrowAsync(quote: SwapQuote, opts: Partial<SwapQuoteExecutionOptsBase>): Promise<string>;
}

/**
 * chainId: The chainId that the desired orders should be for.
 */
export interface SwapQuoteConsumerOpts {
    chainId: number;
}

/**
 * Represents the options provided to a generic SwapQuoteConsumer
 */
export interface SwapQuoteGetOutputOptsBase {}

/**
 * takerAddress: The address to perform the buy. Defaults to the first available address from the provider.
 * gasLimit: The amount of gas to send with a transaction (in Gwei). Defaults to an eth_estimateGas rpc call.
 * gasPrice: Gas price in Wei to use for a transaction
 */
export interface SwapQuoteExecutionOptsBase extends SwapQuoteGetOutputOptsBase {
    takerAddress?: string;
    gasLimit?: number;
    gasPrice?: BigNumber;
}

/**
 * feePercentage: percentage (up to 5%) of the taker asset paid to feeRecipient
 * feeRecipient: address of the receiver of the feePercentage of taker asset
 * ethAmount: The amount of eth (in Wei) sent to the forwarder contract.
 */
export interface ForwarderSwapQuoteGetOutputOpts extends SwapQuoteGetOutputOptsBase {
    feePercentage: number;
    feeRecipient: string;
    ethAmount?: BigNumber;
}

export type SwapQuote = MarketBuySwapQuote | MarketSellSwapQuote;

export interface GetExtensionContractTypeOpts {
    takerAddress?: string;
    ethAmount?: BigNumber;
}

/**
 * takerAddress: The address to perform the buy. Defaults to the first available address from the provider.
 * useConsumerType: If provided, defaults the SwapQuoteConsumer to create output consumed by ConsumerType.
 */
export interface SwapQuoteGetOutputOpts extends ForwarderSwapQuoteGetOutputOpts {
    useExtensionContract: ExtensionContractType;
}

export interface ForwarderSwapQuoteExecutionOpts extends ForwarderSwapQuoteGetOutputOpts, SwapQuoteExecutionOptsBase {}

/**
 * Represents the options for executing a swap quote with SwapQuoteConsumer
 */
export interface SwapQuoteExecutionOpts extends SwapQuoteGetOutputOpts, ForwarderSwapQuoteExecutionOpts {}

/**
 * takerAssetData: String that represents a specific taker asset (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
 * makerAssetData: String that represents a specific maker asset (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
 * orders: An array of objects conforming to SignedOrder. These orders can be used to cover the requested assetBuyAmount plus slippage.
 * bestCaseQuoteInfo: Info about the best case price for the asset.
 * worstCaseQuoteInfo: Info about the worst case price for the asset.
 */
export interface SwapQuoteBase {
    takerAssetData: string;
    makerAssetData: string;
    orders: SignedOrder[];
    bestCaseQuoteInfo: SwapQuoteInfo;
    worstCaseQuoteInfo: SwapQuoteInfo;
}

/**
 * takerAssetFillAmount: The amount of takerAsset sold for makerAsset.
 * type: Specified MarketOperation the SwapQuote is provided for
 */
export interface MarketSellSwapQuote extends SwapQuoteBase {
    takerAssetFillAmount: BigNumber;
    type: MarketOperation.Sell;
}

/**
 * makerAssetFillAmount: The amount of makerAsset bought with takerAsset.
 * type: Specified MarketOperation the SwapQuote is provided for
 */
export interface MarketBuySwapQuote extends SwapQuoteBase {
    makerAssetFillAmount: BigNumber;
    type: MarketOperation.Buy;
}

export interface SwapQuoteWithAffiliateFeeBase {
    feePercentage: number;
}

export interface MarketSellSwapQuoteWithAffiliateFee extends SwapQuoteWithAffiliateFeeBase, MarketSellSwapQuote {}

export interface MarketBuySwapQuoteWithAffiliateFee extends SwapQuoteWithAffiliateFeeBase, MarketBuySwapQuote {}

export type SwapQuoteWithAffiliateFee = MarketBuySwapQuoteWithAffiliateFee | MarketSellSwapQuoteWithAffiliateFee;

/**
 * feeTakerTokenAmount: The amount of takerToken required any fee concerned with completing the swap.
 * takerTokenAmount: The amount of takerToken required to conduct the swap.
 * totalTakerTokenAmount: The total amount of takerToken required to complete the swap (filling orders, and paying affiliate fee)
 * makerTokenAmount: The amount of makerToken that will be acquired through the swap.
 */
export interface SwapQuoteInfo {
    feeTakerTokenAmount: BigNumber;
    totalTakerTokenAmount: BigNumber;
    takerTokenAmount: BigNumber;
    makerTokenAmount: BigNumber;
}

/**
 * slippagePercentage: The percentage buffer to add to account for slippage. Affects max ETH price estimates. Defaults to 0.2 (20%).
 */
export interface SwapQuoteRequestOpts {
    slippagePercentage: number;
}

/**
 * chainId: The ethereum chain id. Defaults to 1 (mainnet).
 * orderRefreshIntervalMs: The interval in ms that getBuyQuoteAsync should trigger an refresh of orders and order states. Defaults to 10000ms (10s).
 * expiryBufferMs: The number of seconds to add when calculating whether an order is expired or not. Defaults to 300s (5m).
 */
export interface SwapQuoterOpts {
<<<<<<< HEAD
<<<<<<< HEAD
    chainId: number;
=======
    networkId?: number;
>>>>>>> edac3aa26... upgraded SwapQuoter for v3
=======
    networkId: number;
>>>>>>> fd8323e29... minor updates
    orderRefreshIntervalMs: number;
    expiryBufferMs: number;
}

/**
 * Possible error messages thrown by an SwapQuoterConsumer instance or associated static methods.
 */
export enum SwapQuoteConsumerError {
    InvalidMarketSellOrMarketBuySwapQuote = 'INVALID_MARKET_BUY_SELL_SWAP_QUOTE',
    InvalidForwarderSwapQuote = 'INVALID_FORWARDER_SWAP_QUOTE_PROVIDED',
    NoAddressAvailable = 'NO_ADDRESS_AVAILABLE',
    SignatureRequestDenied = 'SIGNATURE_REQUEST_DENIED',
    TransactionValueTooLow = 'TRANSACTION_VALUE_TOO_LOW',
}

/**
 * Possible error messages thrown by an SwapQuoter instance or associated static methods.
 */
export enum SwapQuoterError {
    NoEtherTokenContractFound = 'NO_ETHER_TOKEN_CONTRACT_FOUND',
    StandardRelayerApiError = 'STANDARD_RELAYER_API_ERROR',
    InsufficientAssetLiquidity = 'INSUFFICIENT_ASSET_LIQUIDITY',
    AssetUnavailable = 'ASSET_UNAVAILABLE',
}

/**
 * Represents available liquidity for a given assetData
 */
export interface LiquidityForTakerMakerAssetDataPair {
    makerTokensAvailableInBaseUnits: BigNumber;
    takerTokensAvailableInBaseUnits: BigNumber;
}

export enum MarketOperation {
    Sell = 'Sell',
    Buy = 'Buy',
}

export interface OrdersAndRemainingFillAmount {
    resultOrders: PrunedSignedOrder[];
    remainingFillAmount: BigNumber;
}
