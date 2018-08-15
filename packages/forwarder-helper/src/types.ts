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
    /**
     * Given a MarketSellOrdersInfoRequest, returns a MarketSellOrdersInfo containing all information relevant to fulfilling the request
     * using the ForwarderContract marketSellOrdersWithEth function.
     * @param   request     An object that conforms to MarketSellOrdersInfoRequest. See type definition for more information.
     * @return  An object that conforms to MarketSellOrdersInfo that satisfies the request. See type definition for more information.
     */
    getMarketSellOrdersInfo: (request: MarketSellOrdersInfoRequest) => MarketSellOrdersInfo;
}

export enum ForwarderHelperError {
    InsufficientLiquidity = 'INSUFFICIENT_LIQUIDITY',
    InsufficientZrxLiquidity = 'INSUFFICIENT_ZRX_LIQUIDITY',
}

/**
 * makerAssetFillAmount: The amount of makerAsset requesting to be filled
 * feePercentage: Optional affiliate percentage amount factoring into eth amount calculations
 * acceptableEthAmountRange: maximum difference between min and max eth cost
 */
export interface MarketBuyOrdersInfoRequest {
    makerAssetFillAmount: BigNumber;
    feePercentage?: BigNumber;
    acceptableEthAmountRange?: BigNumber;
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
    feePercentage?: BigNumber;
    minEthAmount: BigNumber;
    maxEthAmount: BigNumber;
}

/**
 * ethAmount: The amount of eth used to fill
 * feePercentage: Optional affiliate percentage amount factoring into eth amount calculations
 * acceptableFillAmountRange: maximum difference between min and max asset filled
 */
export interface MarketSellOrdersInfoRequest {
    ethAmount: BigNumber;
    feePercentage?: BigNumber;
    acceptableFillAmountRange?: BigNumber;
}

/**
 * ethAmount: The amount of eth used to fill
 * orders: An array of objects conforming to SignedOrder. These orders can be used to cover the requested ethAmount plus slippage
 * feeOrders: An array of objects conforming to SignedOrder. These orders can be used to cover the fees for the orders param above
 * minFillAmount: Amount of asset purchased in the worst case
 * maxFillAmount: Amount of asset purchased in the best case
 * feePercentage: Affiliate fee percentage used to calculate the eth amounts above. Passed thru directly from the request
 */
export interface MarketSellOrdersInfo {
    ethAmount: BigNumber;
    orders: SignedOrder[];
    feeOrders: SignedOrder[];
    minFillAmount: BigNumber;
    maxFillAmount: BigNumber;
    feePercentage?: BigNumber;
}
