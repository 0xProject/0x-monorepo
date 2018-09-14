import { marketUtils } from '@0xproject/order-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { constants } from './constants';
import { ForwarderHelper, ForwarderHelperError, MarketBuyOrdersInfo, MarketBuyOrdersInfoRequest } from './types';
import { forwarderHelperImplConfigUtils } from './utils/forwarder_helper_impl_config_utils';

const SLIPPAGE_PERCENTAGE = new BigNumber(0.2); // 20% slippage protection, possibly move this into request interface

export interface ForwarderHelperImplConfig {
    orders: SignedOrder[];
    feeOrders: SignedOrder[];
    remainingFillableMakerAssetAmounts?: BigNumber[];
    remainingFillableFeeAmounts?: BigNumber[];
}

export class ForwarderHelperImpl implements ForwarderHelper {
    public readonly config: ForwarderHelperImplConfig;
    constructor(config: ForwarderHelperImplConfig) {
        this.config = forwarderHelperImplConfigUtils.sortedConfig(config);
    }
    public getMarketBuyOrdersInfo(request: MarketBuyOrdersInfoRequest): MarketBuyOrdersInfo {
        const { makerAssetFillAmount, feePercentage } = request;
        const { orders, feeOrders, remainingFillableMakerAssetAmounts, remainingFillableFeeAmounts } = this.config;
        // TODO: make the slippage percentage customizable
        const slippageBufferAmount = makerAssetFillAmount.mul(SLIPPAGE_PERCENTAGE).round();
        const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
            orders,
            makerAssetFillAmount,
            {
                remainingFillableMakerAssetAmounts,
                slippageBufferAmount,
            },
        );
        if (remainingFillAmount.gt(constants.ZERO_AMOUNT)) {
            throw new Error(ForwarderHelperError.InsufficientMakerAssetLiquidity);
        }
        // TODO: update this logic to find the minimum amount of feeOrders to cover the worst case as opposed to
        // finding order that cover all fees, this will help with estimating ETH and minimizing gas usage
        const { resultFeeOrders, remainingFeeAmount } = marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(
            resultOrders,
            feeOrders,
            {
                remainingFillableMakerAssetAmounts,
                remainingFillableFeeAmounts,
            },
        );
        if (remainingFeeAmount.gt(constants.ZERO_AMOUNT)) {
            throw new Error(ForwarderHelperError.InsufficientZrxLiquidity);
        }
        // TODO: calculate min and max eth usage
        // TODO: optimize orders call data
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
