import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { MethodAbi } from 'ethereum-types';

/**
 * makerAssetData: The assetData representing the desired makerAsset.
 * takerAssetData: The assetData representing the desired takerAsset.
 * networkId: The networkId that the desired orders should be for.
 */
export interface OrderProviderRequest {
    makerAssetData: string;
    takerAssetData: string;
    networkId: number;
}

/**
 * orders: An array of orders with optional remaining fillable makerAsset amounts. See type for more info.
 */
export interface OrderProviderResponse {
    orders: SignedOrderWithRemainingFillableMakerAssetAmount[];
}

/**
 * A normal SignedOrder with one extra optional property `remainingFillableMakerAssetAmount`
 * remainingFillableMakerAssetAmount: The amount of the makerAsset that is available to be filled
 */
export interface SignedOrderWithRemainingFillableMakerAssetAmount extends SignedOrder {
    remainingFillableMakerAssetAmount?: BigNumber;
}

/**
 * gerOrdersAsync: Given an OrderProviderRequest, get an OrderProviderResponse.
 * getAvailableMakerAssetDatasAsync: Given a taker asset data string, return all availabled paired maker asset data strings.
 * getAvailableTakerAssetDatasAsync: Given a maker asset data string, return all availabled paired taker asset data strings.
 */
export interface OrderProvider {
    getOrdersAsync: (orderProviderRequest: OrderProviderRequest) => Promise<OrderProviderResponse>;
    getAvailableMakerAssetDatasAsync: (takerAssetData: string) => Promise<string[]>;
    getAvailableTakerAssetDatasAsync: (makerAssetData: string) => Promise<string[]>;
}

/**
 * Represents the metadata to call a smart contract with calldata.
 * calldataHexString: The hexstring of the calldata.
 * to: The contract address to call.
 * ethAmount: If provided, the eth amount in wei to send with the smart contract call.
 */
export interface CalldataInfo {
    calldataHexString: string;
    methodAbi: MethodAbi;
    to: string;
    ethAmount?: BigNumber;
}

/**
 * Represents the metadata to call a smart contract with parameters.
 * params: The metadata object containing all the input parameters of a smart contract call.
 * to: The contract address to call.
 * ethAmount: If provided, the eth amount in wei to send with the smart contract call.
 * methodAbi: The abi of the smart contract to call.
 */
export interface SmartContractParamsInfo<T> {
    params: T;
    to: string;
    ethAmount?: BigNumber;
    methodAbi: MethodAbi;
}

export interface SmartContractParamsBase {
    orders: SignedOrder[];
    signatures: string[];
}

/**
 * orders: An array of objects conforming to SignedOrder. These orders can be used to cover the requested assetBuyAmount plus slippage.
 * makerAssetFillAmount: The amount of makerAsset to swap for.
 * signatures: An array of signatures that attest that the maker of the orders in fact made the orders.
 */
export interface ExchangeMarketBuySmartContractParams extends SmartContractParamsBase {
    makerAssetFillAmount: BigNumber;
    type: 'marketBuy';
}

export interface ExchangeMarketSellSmartContractParams extends SmartContractParamsBase {
    takerAssetFillAmount: BigNumber;
    type: 'marketSell';
}

export type ExchangeSmartContractParams = ExchangeMarketBuySmartContractParams | ExchangeMarketSellSmartContractParams;

export interface ForwarderSmartContractParamsBase {
    feeOrders: SignedOrder[];
    feeSignatures: string[];
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

export type ForwarderSmartContractParams =
    | ForwarderMarketBuySmartContractParams
    | ForwarderMarketSellSmartContractParams;

/**
 * Interface that varying SwapQuoteConsumers adhere to (exchange consumer, router consumer, forwarder consumer, coordinator consumer)
 * getCalldataOrThrow: Get CalldataInfo to swap for tokens with provided SwapQuote. Throws if invalid SwapQuote is provided.
 * getSmartContractParamsOrThrow: Get SmartContractParamsInfo to swap for tokens with provided SwapQuote. Throws if invalid SwapQuote is provided.
 * executeSwapQuoteOrThrowAsync: Executes a web3 transaction to swap for tokens with provided SwapQuote. Throws if invalid SwapQuote is provided.
 */
export interface SwapQuoteConsumerBase<T> {
    getCalldataOrThrowAsync(quote: SwapQuote, opts: Partial<SwapQuoteGetOutputOpts>): Promise<CalldataInfo>;
    getSmartContractParamsOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts>,
    ): Promise<SmartContractParamsInfo<T>>;
    executeSwapQuoteOrThrowAsync(quote: SwapQuote, opts: Partial<SwapQuoteExecutionOpts>): Promise<string>;
}

/**
 * networkId: The networkId that the desired orders should be for.
 */
export interface SwapQuoteConsumerOpts {
    networkId: number;
}

/**
 * Represents the options provided to a generic SwapQuoteConsumer
 */
export interface SwapQuoteGetOutputOpts {}

/**
 * takerAddress: The address to perform the buy. Defaults to the first available address from the provider.
 * gasLimit: The amount of gas to send with a transaction (in Gwei). Defaults to an eth_estimateGas rpc call.
 * gasPrice: Gas price in Wei to use for a transaction
 */
export interface SwapQuoteExecutionOpts extends SwapQuoteGetOutputOpts {
    takerAddress?: string;
    gasLimit?: number;
    gasPrice?: BigNumber;
}

/**
 * feePercentage: percentage (up to 5%) of the taker asset paid to feeRecipient
 * feeRecipient: address of the receiver of the feePercentage of taker asset
 * ethAmount: The amount of eth (in Wei) sent to the forwarder contract.
 */
export interface DynamicSwapQuoteGetOutputOpts extends SwapQuoteGetOutputOpts {
    takerAddress?: string;
}

/**
 * Represents the options for executing a swap quote with ForwarderSwapQuoteConusmer
 */
export interface DynamicSwapQuoteExecutionOpts extends DynamicSwapQuoteGetOutputOpts, SwapQuoteExecutionOpts {}

/**
 * feePercentage: percentage (up to 5%) of the taker asset paid to feeRecipient
 * feeRecipient: address of the receiver of the feePercentage of taker asset
 * ethAmount: The amount of eth (in Wei) sent to the forwarder contract.
 */
export interface ForwarderSwapQuoteGetOutputOpts extends SwapQuoteGetOutputOpts {
    feePercentage: number;
    feeRecipient: string;
    ethAmount?: BigNumber;
}

/**
 * Represents the options for executing a swap quote with ForwarderSwapQuoteConusmer
 */
export interface ForwarderSwapQuoteExecutionOpts extends ForwarderSwapQuoteGetOutputOpts, SwapQuoteExecutionOpts {}

export type SwapQuote = MarketBuySwapQuote | MarketSellSwapQuote;

/**
 * takerAssetData: String that represents a specific taker asset (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
 * makerAssetData: String that represents a specific maker asset (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
 * makerAssetFillAmount: The amount of makerAsset to swap for.
 * orders: An array of objects conforming to SignedOrder. These orders can be used to cover the requested assetBuyAmount plus slippage.
 * feeOrders: An array of objects conforming to SignedOrder. These orders can be used to cover the fees for the orders param above.
 * bestCaseQuoteInfo: Info about the best case price for the asset.
 * worstCaseQuoteInfo: Info about the worst case price for the asset.
 */
export interface SwapQuoteBase {
    takerAssetData: string;
    makerAssetData: string;
    orders: SignedOrder[];
    feeOrders: SignedOrder[];
    bestCaseQuoteInfo: SwapQuoteInfo;
    worstCaseQuoteInfo: SwapQuoteInfo;
}

export interface MarketSellSwapQuote extends SwapQuoteBase {
    takerAssetFillAmount: BigNumber;
    type: 'marketSell';
}

export interface MarketBuySwapQuote extends SwapQuoteBase {
    makerAssetFillAmount: BigNumber;
    type: 'marketBuy';
}

export interface SwapQuoteWithAffiliateFeeBase {
    feePercentage: number;
}

export interface MarketSellSwapQuoteWithAffiliateFee extends SwapQuoteWithAffiliateFeeBase, MarketSellSwapQuote {}

export interface MarketBuySwapQuoteWithAffiliateFee extends SwapQuoteWithAffiliateFeeBase, MarketBuySwapQuote {}

export type SwapQuoteWithAffiliateFee = MarketBuySwapQuoteWithAffiliateFee | MarketSellSwapQuoteWithAffiliateFee;
/**
 * assetEthAmount: The amount of eth required to pay for the requested asset.
 * feeEthAmount: The amount of eth required to pay any fee concerned with completing the swap.
 * totalEthAmount: The total amount of eth required to complete the buy (filling orders, feeOrders, and paying affiliate fee).
 */
export interface SwapQuoteInfo {
    feeTakerTokenAmount: BigNumber;
    totalTakerTokenAmount: BigNumber;
    takerTokenAmount: BigNumber;
    makerTokenAmount: BigNumber;
}

/**
 * shouldForceOrderRefresh: If set to true, new orders and state will be fetched instead of waiting for the next orderRefreshIntervalMs. Defaults to false.
 * slippagePercentage: The percentage buffer to add to account for slippage. Affects max ETH price estimates. Defaults to 0.2 (20%).
 */
export interface SwapQuoteRequestOpts {
    shouldForceOrderRefresh: boolean;
    slippagePercentage: number;
}

/*
 * Options for checking liquidity
 * shouldForceOrderRefresh: If set to true, new orders and state will be fetched instead of waiting for the next orderRefreshIntervalMs. Defaults to false.
 */
export type LiquidityRequestOpts = Pick<SwapQuoteRequestOpts, 'shouldForceOrderRefresh'>;

/**
 * networkId: The ethereum network id. Defaults to 1 (mainnet).
 * orderRefreshIntervalMs: The interval in ms that getBuyQuoteAsync should trigger an refresh of orders and order states. Defaults to 10000ms (10s).
 * expiryBufferMs: The number of seconds to add when calculating whether an order is expired or not. Defaults to 300s (5m).
 */
export interface SwapQuoterOpts {
    networkId: number;
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
    NoZrxTokenContractFound = 'NO_ZRX_TOKEN_CONTRACT_FOUND',
    StandardRelayerApiError = 'STANDARD_RELAYER_API_ERROR',
    InsufficientAssetLiquidity = 'INSUFFICIENT_ASSET_LIQUIDITY',
    InsufficientZrxLiquidity = 'INSUFFICIENT_ZRX_LIQUIDITY',
    InvalidOrderProviderResponse = 'INVALID_ORDER_PROVIDER_RESPONSE',
    AssetUnavailable = 'ASSET_UNAVAILABLE',
}

/**
 * orders: An array of signed orders
 * remainingFillableMakerAssetAmounts: A list of fillable amounts for the signed orders. The index of an item in the array associates the amount with the corresponding order.
 */
export interface OrdersAndFillableAmounts {
    orders: SignedOrder[];
    remainingFillableMakerAssetAmounts: BigNumber[];
}

/**
 * Represents available liquidity for a given assetData
 */
export interface LiquidityForAssetData {
    makerTokensAvailableInBaseUnits: BigNumber;
    takerTokensAvailableInBaseUnits: BigNumber;
}
