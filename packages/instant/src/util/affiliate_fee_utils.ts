import { BigNumber } from '@0x/utils';

import { ZeroExAPIQuoteResponse } from '../types';

import { assert } from './assert';

// TODO delete utils from swapper
export const affiliateFeeUtils = {
    /**
     * Get the amount of eth to send for a forwarder contract call (includes takerAssetAmount, protocol fees, and specified affiliate fee amount)
     * @param swapQuoteInfo SwapQuoteInfo to generate total eth amount from
     * @param feePercentage Percentage of additive fees to apply to totalTakerAssetAmount + protocol fee. (max 5%)
     */
    getTotalEthAmountWithAffiliateFee(quote: ZeroExAPIQuoteResponse, feePercentage: number): BigNumber {
        assert.assert(
            feePercentage >= 0 && feePercentage <= 1,
            'feePercentage must be between range 0-1 (inclusive)',
        );
        const ethAmount = quote.value;
        // HACK(dekz): This is actually in WEI amount not ETH
        const affiliateFeeAmount = ethAmount.multipliedBy(feePercentage).toFixed(0, BigNumber.ROUND_UP);
        const ethAmountWithFees = ethAmount.plus(affiliateFeeAmount);
        return ethAmountWithFees;
    },
};
