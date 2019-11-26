import { BigNumber } from '@0x/utils';

import { constants } from '../constants';
import { SwapQuoteInfo } from '../types';

import { assert } from './assert';

export const affiliateFeeUtils = {
    /**
     * Get the amount of eth to send for a forwarder contract call (includes takerAssetAmount, protocol fees, and specified affiliate fee amount)
     * @param swapQuoteInfo SwapQuoteInfo to generate total eth amount from
     * @param feePercentage Percentage of additive fees to apply to totalTakerAssetAmount + protocol fee. (max 5%)
     */
    getTotalEthAmountWithAffiliateFee(swapQuoteInfo: SwapQuoteInfo, feePercentage: number): BigNumber {
        assert.assert(
            feePercentage >= 0 && feePercentage <= constants.MAX_AFFILIATE_FEE_PERCENTAGE,
            'feePercentage must be between range 0-0.05 (inclusive)',
        );
        const ethAmount = swapQuoteInfo.protocolFeeInWeiAmount.plus(swapQuoteInfo.totalTakerAssetAmount);
        // HACK(dekz): This is actually in WEI amount not ETH
        const affiliateFeeAmount = ethAmount.multipliedBy(feePercentage).toFixed(0, BigNumber.ROUND_UP);
        const ethAmountWithFees = ethAmount.plus(affiliateFeeAmount);
        return ethAmountWithFees;
    },
};
