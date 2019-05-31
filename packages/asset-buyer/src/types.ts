import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

/**
 * makerAssetData: The assetData representing the desired makerAsset.
 * takerAssetData: The assetData representing the desired takerAsset.
 * networkId: The networkId that the desired orders should be for.
 */
export interface OrderProviderRequest {
    makerAssetData: string;
    takerAssetData: string;
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
 */
export interface OrderProvider {
    getOrdersAsync: (orderProviderRequest: OrderProviderRequest) => Promise<OrderProviderResponse>;
    getAvailableMakerAssetDatasAsync: (takerAssetData: string) => Promise<string[]>;
    getAvailableTakerAssetDatasAsync: (makerAssetData: string) => Promise<string[]>;
}

/**
 * assetData: String that represents a specific asset (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
 * assetBuyAmount: The amount of asset to buy.
 * orders: An array of objects conforming to SignedOrder. These orders can be used to cover the requested assetBuyAmount plus slippage.
 * feeOrders: An array of objects conforming to SignedOrder. These orders can be used to cover the fees for the orders param above.
 * feePercentage: Optional affiliate fee percentage used to calculate the eth amounts above.
 * bestCaseQuoteInfo: Info about the best case price for the asset.
 * worstCaseQuoteInfo: Info about the worst case price for the asset.
 */
export interface BuyQuote {
    takerAssetData: string;
    makerAssetData: string;
    makerAssetBuyAmount: BigNumber;
    orders: SignedOrder[];
    feeOrders: SignedOrder[];
    bestCaseQuoteInfo: BuyQuoteInfo;
    worstCaseQuoteInfo: BuyQuoteInfo;
    toAddress: string; // exchange address, coordinator address
    isUsingCoordinator: boolean;
}

/**
 * assetEthAmount: The amount of eth required to pay for the requested asset.
 * feeEthAmount: The amount of eth required to pay the affiliate fee.
 * totalEthAmount: The total amount of eth required to complete the buy (filling orders, feeOrders, and paying affiliate fee).
 */
export interface BuyQuoteInfo {
    takerTokenAmount: BigNumber;
    feeTakerTokenAmount: BigNumber;
    totalTakerTokenAmount: BigNumber;
}

/**
 * shouldForceOrderRefresh: If set to true, new orders and state will be fetched instead of waiting for the next orderRefreshIntervalMs. Defaults to false.
 * slippagePercentage: The percentage buffer to add to account for slippage. Affects max ETH price estimates. Defaults to 0.2 (20%).
 */
export interface BuyQuoteRequestOpts {
    shouldForceOrderRefresh: boolean;
    slippagePercentage: number;
}

/*
 * Options for checking liquidity
 *
 * shouldForceOrderRefresh: If set to true, new orders and state will be fetched instead of waiting for the next orderRefreshIntervalMs. Defaults to false.
 */
export type LiquidityRequestOpts = Pick<BuyQuoteRequestOpts, 'shouldForceOrderRefresh'>;

/**
 * ethAmount: The desired amount of eth to spend. Defaults to buyQuote.worstCaseQuoteInfo.totalEthAmount.
 * takerAddress: The address to perform the buy. Defaults to the first available address from the provider.
 * gasLimit: The amount of gas to send with a transaction (in Gwei). Defaults to an eth_estimateGas rpc call.
 * gasPrice: Gas price in Wei to use for a transaction
 * feeRecipient: The address where affiliate fees are sent. Defaults to null address (0x000...000).
 */
export interface BuyQuoteExecutionOpts {
    ethAmount?: BigNumber;
    takerAddress?: string;
    gasLimit?: number;
    gasPrice?: BigNumber;
    feeRecipient: string;
}

/**
 * networkId: The ethereum network id. Defaults to 1 (mainnet).
 * orderRefreshIntervalMs: The interval in ms that getBuyQuoteAsync should trigger an refresh of orders and order states. Defaults to 10000ms (10s).
 * expiryBufferSeconds: The number of seconds to add when calculating whether an order is expired or not. Defaults to 300s (5m).
 */
export interface AssetBuyerOpts {
    networkId: number;
    orderRefreshIntervalMs: number;
    expiryBufferSeconds: number;
}

/**
 * Possible error messages thrown by an AssetBuyer instance or associated static methods.
 */
export enum AssetBuyerError {
    NoEtherTokenContractFound = 'NO_ETHER_TOKEN_CONTRACT_FOUND',
    NoZrxTokenContractFound = 'NO_ZRX_TOKEN_CONTRACT_FOUND',
    StandardRelayerApiError = 'STANDARD_RELAYER_API_ERROR',
    InsufficientAssetLiquidity = 'INSUFFICIENT_ASSET_LIQUIDITY',
    InsufficientZrxLiquidity = 'INSUFFICIENT_ZRX_LIQUIDITY',
    NoAddressAvailable = 'NO_ADDRESS_AVAILABLE',
    InvalidOrderProviderResponse = 'INVALID_ORDER_PROVIDER_RESPONSE',
    AssetUnavailable = 'ASSET_UNAVAILABLE',
    SignatureRequestDenied = 'SIGNATURE_REQUEST_DENIED',
    TransactionValueTooLow = 'TRANSACTION_VALUE_TOO_LOW',
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
