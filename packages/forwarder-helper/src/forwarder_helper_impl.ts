import { marketUtils } from '@0xproject/order-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

import { constants } from './constants';
import { ForwarderHelper, ForwarderHelperError, MarketBuyOrdersInfo, MarketBuyOrdersInfoRequest } from './types';

const SLIPPAGE_PERCENTAGE = new BigNumber(0.2); // 20% slippage protection, possibly move this into request interface

export class ForwarderHelperImpl implements ForwarderHelper {
    private _orders: SignedOrder[];
    private _feeOrders: SignedOrder[];
    private _remainingFillableMakerAssetAmountsIfExists?: BigNumber[];
    private _remainingFillableFeeAmountsIfExists?: BigNumber[];
    constructor(
        orders: SignedOrder[],
        feeOrders: SignedOrder[] = [] as SignedOrder[],
        remainingFillableMakerAssetAmounts?: BigNumber[],
        remainingFillableFeeAmounts?: BigNumber[],
    ) {
        this._orders = orders;
        this._feeOrders = feeOrders;
        this._remainingFillableMakerAssetAmountsIfExists = remainingFillableMakerAssetAmounts;
        this._remainingFillableFeeAmountsIfExists = remainingFillableFeeAmounts;
    }
    public getMarketBuyOrdersInfo(request: MarketBuyOrdersInfoRequest): MarketBuyOrdersInfo {
        const { makerAssetFillAmount, feePercentage } = request;
        // TODO: make the slippage percentage customizable
        const slippageBufferAmount = makerAssetFillAmount.mul(SLIPPAGE_PERCENTAGE);
        const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
            this._orders,
            makerAssetFillAmount,
            {
                remainingFillableMakerAssetAmounts: this._remainingFillableMakerAssetAmountsIfExists,
                slippageBufferAmount,
            },
        );
        if (remainingFillAmount.gt(constants.ZERO_AMOUNT)) {
            throw new Error(ForwarderHelperError.InsufficientLiquidity);
        }
        // TODO: update this logic to find the minimum amount of feeOrders to cover the worst case as opposed to
        // finding order that cover all fees, this will help with estimating ETH and minimizing gas usage
        const { resultFeeOrders, remainingFeeAmount } = marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(
            resultOrders,
            this._feeOrders,
            {
                remainingFillableMakerAssetAmounts: this._remainingFillableMakerAssetAmountsIfExists,
                remainingFillableFeeAmounts: this._remainingFillableFeeAmountsIfExists,
            },
        );
        if (remainingFeeAmount.gt(constants.ZERO_AMOUNT)) {
            throw new Error(ForwarderHelperError.InsufficientZrxLiquidity);
        }
        // TODO: calculate min and max eth usage
        return {
            makerAssetFillAmount,
            orders: resultOrders,
            feeOrders: resultFeeOrders,
            minEthAmount: constants.ZERO_AMOUNT,
            maxEthAmount: constants.ZERO_AMOUNT,
            feePercentage,
        };
    }
}
