import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

/**
 * assetBuyAmount: The amount of asset to buy.
 * feePercentage: Optional affiliate percentage amount factoring into eth amount calculations.
 */
export interface BuyQuoteRequest {
    assetBuyAmount: BigNumber;
    feePercentage?: BigNumber;
}

/**
 * assetData: The asset information.
 * orders: An array of objects conforming to SignedOrder. These orders can be used to cover the requested assetBuyAmount plus slippage.
 * feeOrders: An array of objects conforming to SignedOrder. These orders can be used to cover the fees for the orders param above.
 * minRate: Min rate that needs to be paid in order to execute the buy.
 * maxRate: Max rate that can be paid in order to execute the buy.
 * assetBuyAmount: The amount of asset to buy. Passed through directly from the request.
 * feePercentage: Affiliate fee percentage used to calculate the eth amounts above. Passed through directly from the request.
 */
export interface BuyQuote {
    assetData: string;
    orders: SignedOrder[];
    feeOrders: SignedOrder[];
    minRate: BigNumber;
    maxRate: BigNumber;
    assetBuyAmount: BigNumber;
    feePercentage?: BigNumber;
}

/**
 * Possible errors thrown by an AssetBuyer instance or associated static methods
 */
export enum AssetBuyerError {
    NoEtherTokenContractFound = 'NO_ETHER_TOKEN_CONTRACT_FOUND',
    NoZrxTokenContractFound = 'NO_ZRX_TOKEN_CONTRACT_FOUND',
    StandardRelayerApiError = 'STANDARD_RELAYER_API_ERROR',
    InsufficientAssetLiquidity = 'INSUFFICIENT_ASSET_LIQUIDITY',
    InsufficientZrxLiquidity = 'INSUFFICIENT_ZRX_LIQUIDITY',
    NoAddressAvailable = 'NO_ADDRESS_AVAILABLE',
}
