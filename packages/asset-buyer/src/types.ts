import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

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
 * Given an OrderProviderRequest, get an OrderProviderResponse.
 */
export interface OrderProvider {
    getOrdersAsync: (orderProviderRequest: OrderProviderRequest) => Promise<OrderProviderResponse>;
}

/**
 * assetData: String that represents a specific asset (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
 * orders: An array of objects conforming to SignedOrder. These orders can be used to cover the requested assetBuyAmount plus slippage.
 * feeOrders: An array of objects conforming to SignedOrder. These orders can be used to cover the fees for the orders param above.
 * minRate: Min rate that needs to be paid in order to execute the buy.
 * maxRate: Max rate that can be paid in order to execute the buy.
 * assetBuyAmount: The amount of asset to buy.
 * feePercentage: Optional affiliate fee percentage used to calculate the eth amounts above.
 */
export interface BuyQuote {
    assetData: string;
    orders: SignedOrder[];
    feeOrders: SignedOrder[];
    minRate: BigNumber;
    maxRate: BigNumber;
    assetBuyAmount: BigNumber;
    feePercentage?: number;
}

/**
 * feePercentage: The affiliate fee percentage. Defaults to 0.
 * shouldForceOrderRefresh: If set to true, new orders and state will be fetched instead of waiting for the next orderRefreshIntervalMs. Defaults to false.
 * slippagePercentage: The percentage buffer to add to account for slippage. Affects max ETH price estimates. Defaults to 0.2 (20%).
 */
export interface BuyQuoteRequestOpts {
    feePercentage: number;
    shouldForceOrderRefresh: boolean;
    slippagePercentage: number;
}

/**
 * rate: The desired rate to execute the buy at. Affects the amount of ETH sent with the transaction, defaults to buyQuote.maxRate.
 * takerAddress: The address to perform the buy. Defaults to the first available address from the provider.
 * feeRecipient: The address where affiliate fees are sent. Defaults to null address (0x000...000).
 */
export interface BuyQuoteExecutionOpts {
    rate?: BigNumber;
    takerAddress?: string;
    feeRecipient: string;
}

/**
 * networkId: The ethereum network id. Defaults to 1 (mainnet).
 * orderRefreshIntervalMs: The interval in ms that getBuyQuoteAsync should trigger an refresh of orders and order states. Defaults to 10000ms (10s).
 * expiryBufferSeconds: The number of seconds to add when calculating whether an order is expired or not. Defaults to 15s.
 */
export interface AssetBuyerOpts {
    networkId: number;
    orderRefreshIntervalMs: number;
    expiryBufferSeconds: number;
}

/**
 * Possible errors thrown by an AssetBuyer instance or associated static methods.
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
}

export interface OrdersAndFillableAmounts {
    orders: SignedOrder[];
    remainingFillableMakerAssetAmounts: BigNumber[];
}
