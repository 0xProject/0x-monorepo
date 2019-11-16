import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { MethodAbi } from 'ethereum-types';

/**
 * expiryBufferMs: The number of seconds to add when calculating whether an order is expired or not. Defaults to 300s (5m).
 * permittedOrderFeeTypes: A set of all the takerFee types that OrderPruner will filter for
 */
export interface OrderPrunerOpts {
    expiryBufferMs: number;
    permittedOrderFeeTypes: Set<OrderPrunerPermittedFeeTypes>;
}

/**
 * Represents the on-chain metadata of a signed order
 */
export interface OrderPrunerOnChainMetadata {
    orderStatus: number;
    orderHash: string;
    orderTakerAssetFilledAmount: BigNumber;
    fillableTakerAssetAmount: BigNumber;
    isValidSignature: boolean;
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
 * fillableMakerAssetAmount: Amount of makerAsset that is fillable
 * fillableTakerAssetAmount: Amount of takerAsset that is fillable
 * fillableTakerFeeAmount: Amount of takerFee paid to fill fillableTakerAssetAmount
 */
export interface PrunedSignedOrder extends SignedOrder {
    fillableMakerAssetAmount: BigNumber;
    fillableTakerAssetAmount: BigNumber;
    fillableTakerFeeAmount: BigNumber;
}

/**
 * Represents the metadata to call a smart contract with calldata.
 * calldataHexString: The hexstring of the calldata.
 * methodAbi: The ABI of the smart contract method to call.
 * toAddress: The contract address to call.
 * ethAmount: The eth amount in wei to send with the smart contract call.
 */
export interface CalldataInfo {
    calldataHexString: string;
    methodAbi: MethodAbi;
    toAddress: string;
    ethAmount: BigNumber;
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
    ethAmount: BigNumber;
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
    getCalldataOrThrowAsync(quote: SwapQuote, opts: Partial<SwapQuoteGetOutputOpts>): Promise<CalldataInfo>;
    getSmartContractParamsOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteGetOutputOpts>,
    ): Promise<SmartContractParamsInfo<T>>;
    executeSwapQuoteOrThrowAsync(quote: SwapQuote, opts: Partial<SwapQuoteExecutionOpts>): Promise<string>;
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
export interface SwapQuoteGetOutputOpts {
    useExtensionContract: ExtensionContractType;
    extensionContractOpts?: ForwarderExtensionContractOpts | any;
}

/**
 * ethAmount: The amount of eth sent with the execution of a swap.
 * takerAddress: The address to perform the buy. Defaults to the first available address from the provider.
 * gasLimit: The amount of gas to send with a transaction (in Gwei). Defaults to an eth_estimateGas rpc call.
 */
export interface SwapQuoteExecutionOpts extends SwapQuoteGetOutputOpts {
    ethAmount?: BigNumber;
    takerAddress?: string;
    gasLimit?: number;
}

/**
 * ethAmount: The amount of eth (in Wei) sent to the forwarder contract.
 * feePercentage: percentage (up to 5%) of the taker asset paid to feeRecipient
 * feeRecipient: address of the receiver of the feePercentage of taker asset
 */
export interface ForwarderExtensionContractOpts {
    feePercentage: number;
    feeRecipient: string;
}

export type SwapQuote = MarketBuySwapQuote | MarketSellSwapQuote;

export interface GetExtensionContractTypeOpts {
    takerAddress?: string;
    ethAmount?: BigNumber;
}

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
    gasPrice: BigNumber;
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

/**
 * feeTakerAssetAmount: The amount of takerAsset reserved for paying takerFees when swapping for desired assets.
 * takerAssetAmount: The amount of takerAsset swapped for desired makerAsset.
 * totalTakerAssetAmount: The total amount of takerAsset required to complete the swap (filling orders, and paying takerFees).
 * makerAssetAmount: The amount of makerAsset that will be acquired through the swap.
 * protocolFeeInEthAmount: The amount of eth to pay as protocol fee to perform the swap for desired asset.
 */
export interface SwapQuoteInfo {
    feeTakerAssetAmount: BigNumber;
    takerAssetAmount: BigNumber;
    totalTakerAssetAmount: BigNumber;
    makerAssetAmount: BigNumber;
    protocolFeeInEthAmount: BigNumber;
}

/**
 * slippagePercentage: The percentage buffer to add to account for slippage. Affects max ETH price estimates. Defaults to 0.2 (20%).
 * gasPrice: gas price to determine protocolFee amount, default to ethGasStation fast amount
 */
export interface SwapQuoteRequestOpts {
    slippagePercentage: number;
    gasPrice?: BigNumber;
}

/**
 * chainId: The ethereum chain id. Defaults to 1 (mainnet).
 * orderRefreshIntervalMs: The interval in ms that getBuyQuoteAsync should trigger an refresh of orders and order states. Defaults to 10000ms (10s).
 * expiryBufferMs: The number of seconds to add when calculating whether an order is expired or not. Defaults to 300s (5m).
 */
export interface SwapQuoterOpts extends OrderPrunerOpts {
    chainId: number;
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
    NoGasPriceProvidedOrEstimated = 'NO_GAS_PRICE_PROVIDED_OR_ESTIMATED',
}

/**
 * Represents available liquidity for a given assetData.
 */
export interface LiquidityForTakerMakerAssetDataPair {
    makerAssetAvailableInBaseUnits: BigNumber;
    takerAssetAvailableInBaseUnits: BigNumber;
}

/**
 * Represents two main market operations supported by asset-swapper.
 */
export enum MarketOperation {
    Sell = 'Sell',
    Buy = 'Buy',
}

/**
 * Represents varying order takerFee types that can be pruned for by OrderPruner.
 */
export enum OrderPrunerPermittedFeeTypes {
    NoFees = 'NO_FEES',
    MakerDenominatedTakerFee = 'MAKER_DENOMINATED_TAKER_FEE',
    TakerDenominatedTakerFee = 'TAKER_DENOMINATED_TAKER_FEE',
}
