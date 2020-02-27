import { BigNumber } from '@0x/utils';
import { SwapQuoteInfo } from '../types';
export declare const affiliateFeeUtils: {
    /**
     * Get the amount of eth to send for a forwarder contract call (includes takerAssetAmount, protocol fees, and specified affiliate fee amount)
     * @param swapQuoteInfo SwapQuoteInfo to generate total eth amount from
     * @param feePercentage Percentage of additive fees to apply to totalTakerAssetAmount + protocol fee.
     */
    getTotalEthAmountWithAffiliateFee(swapQuoteInfo: SwapQuoteInfo, feePercentage: number): BigNumber;
    /**
     * Get the affiliate fee owed to the forwarder fee recipient.
     * @param swapQuoteInfo SwapQuoteInfo to generate total eth amount from
     * @param feePercentage Percentage of additive fees to apply to totalTakerAssetAmount + protocol fee.
     */
    getFeeAmount(swapQuoteInfo: SwapQuoteInfo, feePercentage: number): BigNumber;
};
//# sourceMappingURL=affiliate_fee_utils.d.ts.map