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

export interface BuyQuoteRequestOpts {
    feePercentage: number;
    shouldForceOrderRefresh: boolean;
    slippagePercentage: number;
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
}

/**
 * Possible errors thrown by an StandardRelayerApiAssetBuyerManager instance or associated static methods.
 */
export enum StandardRelayerApiAssetBuyerManagerError {
    AssetBuyerNotFound = 'ASSET_BUYER_NOT_FOUND',
}

export interface AssetBuyerOrdersAndFillableAmounts {
    orders: SignedOrder[];
    feeOrders: SignedOrder[];
    remainingFillableMakerAssetAmounts: BigNumber[];
    remainingFillableFeeAmounts: BigNumber[];
}
