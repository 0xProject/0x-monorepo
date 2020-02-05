import { ContractAddresses } from '@0x/contract-wrappers';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { GetMarketOrdersOpts } from './utils/market_operation_utils/types';

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
export interface SignedOrderWithFillableAmounts extends SignedOrder {
    fillableMakerAssetAmount: BigNumber;
    fillableTakerAssetAmount: BigNumber;
    fillableTakerFeeAmount: BigNumber;
}

/**
 * Represents the metadata to call a smart contract with calldata.
 * calldataHexString: The hexstring of the calldata.
 * toAddress: The contract address to call.
 * ethAmount: The eth amount in wei to send with the smart contract call.
 */
export interface CalldataInfo {
    calldataHexString: string;
    toAddress: string;
    ethAmount: BigNumber;
}

/**
 * Represents the varying smart contracts that can consume a valid swap quote
 */
export enum ExtensionContractType {
    Forwarder = 'FORWARDER',
    None = 'NONE',
}

/**
 * feePercentage: Optional affiliate fee percentage used to calculate the eth amount paid to fee recipient.
 * feeRecipient: The address where affiliate fees are sent. Defaults to null address (0x000...000).
 */
export interface ForwarderSmartContractParamsBase {
    feePercentage: BigNumber;
    feeRecipient: string;
}

/**
 * Interface that varying SwapQuoteConsumers adhere to (exchange consumer, router consumer, forwarder consumer, coordinator consumer)
 * getCalldataOrThrow: Get CalldataInfo to swap for tokens with provided SwapQuote. Throws if invalid SwapQuote is provided.
 * executeSwapQuoteOrThrowAsync: Executes a web3 transaction to swap for tokens with provided SwapQuote. Throws if invalid SwapQuote is provided.
 */
export interface SwapQuoteConsumerBase {
    getCalldataOrThrowAsync(quote: SwapQuote, opts: Partial<SwapQuoteGetOutputOpts>): Promise<CalldataInfo>;
    executeSwapQuoteOrThrowAsync(quote: SwapQuote, opts: Partial<SwapQuoteExecutionOpts>): Promise<string>;
}

/**
 * chainId: The chainId that the desired orders should be for.
 */
export interface SwapQuoteConsumerOpts {
    chainId: number;
    contractAddresses?: ContractAddresses;
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
 * gasPrice: gas price used to determine protocolFee amount, default to ethGasStation fast amount.
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
    sourceBreakdown: SwapQuoteOrdersBreakdown;
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
 * protocolFeeInWeiAmount: The amount of ETH to pay (in WEI) as protocol fee to perform the swap for desired asset.
 */
export interface SwapQuoteInfo {
    feeTakerAssetAmount: BigNumber;
    takerAssetAmount: BigNumber;
    totalTakerAssetAmount: BigNumber;
    makerAssetAmount: BigNumber;
    protocolFeeInWeiAmount: BigNumber;
}

/**
 * percentage breakdown of each liquidity source used in quote
 */
export interface SwapQuoteOrdersBreakdown {
    [source: string]: BigNumber;
}

/**
 * slippagePercentage: The percentage buffer to add to account for slippage. Affects max ETH price estimates. Defaults to 0.2 (20%).
 * gasPrice: gas price to determine protocolFee amount, default to ethGasStation fast amount
 */
export interface SwapQuoteRequestOpts extends CalculateSwapQuoteOpts {
    slippagePercentage: number;
    gasPrice?: BigNumber;
}

/**
 * Opts required to generate a SwapQuote with SwapQuoteCalculator
 */
export interface CalculateSwapQuoteOpts extends GetMarketOrdersOpts {}

/**
 * chainId: The ethereum chain id. Defaults to 1 (mainnet).
 * orderRefreshIntervalMs: The interval in ms that getBuyQuoteAsync should trigger an refresh of orders and order states. Defaults to 10000ms (10s).
 * expiryBufferMs: The number of seconds to add when calculating whether an order is expired or not. Defaults to 300s (5m).
 * contractAddresses: Optionally override the contract addresses used for the chain
 * samplerGasLimit: The gas limit used when querying the sampler contract. Defaults to 60e6
 */
export interface SwapQuoterOpts extends OrderPrunerOpts {
    chainId: number;
    orderRefreshIntervalMs: number;
    expiryBufferMs: number;
    contractAddresses?: ContractAddresses;
    samplerGasLimit?: number;
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
