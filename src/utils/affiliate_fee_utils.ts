import { BigNumber } from '@0x/utils';

import { SwapQuoteInfo } from '../types';

import { assert } from './assert';

export const affiliateFeeUtils = {
    /**
     * Get the amount of eth to send for a forwarder contract call (includes takerAssetAmount, protocol fees, and specified affiliate fee amount)
     * @param swapQuoteInfo SwapQuoteInfo to generate total eth amount from
     * @param feePercentage Percentage of additive fees to apply to totalTakerAssetAmount + protocol fee.
     */
    getTotalEthAmountWithAffiliateFee(swapQuoteInfo: SwapQuoteInfo, feePercentage: number): BigNumber {
        const ethAmount = swapQuoteInfo.protocolFeeInWeiAmount.plus(swapQuoteInfo.totalTakerAssetAmount);
        const ethAmountWithFees = ethAmount.plus(affiliateFeeUtils.getFeeAmount(swapQuoteInfo, feePercentage));
        return ethAmountWithFees;
    },
    /**
     * Get the affiliate fee owed to the forwarder fee recipient.
     * @param swapQuoteInfo SwapQuoteInfo to generate total eth amount from
     * @param feePercentage Percentage of additive fees to apply to totalTakerAssetAmount + protocol fee.
     */
    getFeeAmount(swapQuoteInfo: SwapQuoteInfo, feePercentage: number): BigNumber {
        assert.assert(feePercentage >= 0, 'feePercentage must be >= 0');
        const ethAmount = swapQuoteInfo.protocolFeeInWeiAmount.plus(swapQuoteInfo.totalTakerAssetAmount);
        // HACK(dekz): This is actually in WEI amount not ETH
        return ethAmount.times(feePercentage).integerValue(BigNumber.ROUND_UP);
    },
};
