import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

import {
    ForwarderHelper,
    MarketBuyOrdersInfo,
    MarketBuyOrdersInfoRequest,
    MarketSellOrdersInfo,
    MarketSellOrdersInfoRequest,
} from './types';

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
        const { makerAssetFillAmount, feePercentage, acceptableEthAmountRange } = request;
        return {
            makerAssetFillAmount,
            orders: this._orders,
            feeOrders: this._feeOrders,
            minEthAmount: new BigNumber(0),
            maxEthAmount: new BigNumber(0),
            feePercentage,
        };
    }
    public getMarketSellOrdersInfo(request: MarketSellOrdersInfoRequest): MarketSellOrdersInfo {
        const { ethAmount, feePercentage, acceptableFillAmountRange } = request;
        return {
            ethAmount,
            orders: this._orders,
            feeOrders: this._feeOrders,
            minFillAmount: new BigNumber(0),
            maxFillAmount: new BigNumber(0),
            feePercentage,
        };
    }
}
