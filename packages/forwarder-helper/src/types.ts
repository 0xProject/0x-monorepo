import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

export interface ForwarderHelper {
    /**
     * Given a MarketBuyOrdersInfoRequest, returns a MarketBuyOrdersInfo containing all information relevant to fulfilling the request
     * using the ForwarderContract marketBuyOrdersWithEth function.
     * @param   request     An object that conforms to MarketBuyOrdersInfoRequest. See type definition for more information.
     * @return  An object that conforms to MarketBuyOrdersInfo that satisfies the request. See type definition for more information.
     */
    getMarketBuyOrdersInfo: (request: MarketBuyOrdersInfoRequest) => MarketBuyOrdersInfo;
}

export enum ForwarderHelperError {
    InsufficientLiquidity = 'INSUFFICIENT_LIQUIDITY',
    InsufficientZrxLiquidity = 'INSUFFICIENT_ZRX_LIQUIDITY',
}

/**
 * makerAssetFillAmount: The amount of makerAsset requesting to be filled
 * feePercentage: Optional affiliate percentage amount factoring into eth amount calculations
 */
export interface MarketBuyOrdersInfoRequest {
    makerAssetFillAmount: BigNumber;
    feePercentage?: BigNumber;
}

/**
 * makerAssetFillAmount: The amount of makerAsset requesting to be filled
 * orders: An array of objects conforming to SignedOrder. These orders can be used to cover the requested makerAssetFillAmount plus slippage
 * feeOrders: An array of objects conforming to SignedOrder. These orders can be used to cover the fees for the orders param above
 * minEthAmount: Amount of eth in wei to send with the tx for the most optimistic case
 * maxEthAmount: Amount of eth in wei to send with the tx for the worst case
 * feePercentage: Affiliate fee percentage used to calculate the eth amounts above. Passed thru directly from the request
 */
export interface MarketBuyOrdersInfo {
    makerAssetFillAmount: BigNumber;
    orders: SignedOrder[];
    feeOrders: SignedOrder[];
    minEthAmount: BigNumber;
    maxEthAmount: BigNumber;
    feePercentage?: BigNumber;
}
