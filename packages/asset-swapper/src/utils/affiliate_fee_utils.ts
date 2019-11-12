import { BigNumber } from '@0x/utils';

import { SwapQuoteInfo } from '../types';

export const affiliateFeeUtils = {
    getTotalEthAmountWithAffiliateFee(
        swapQuoteInfo: SwapQuoteInfo,
        feePercentage: number,
    ): BigNumber {
        const ethAmount = swapQuoteInfo.protocolFeeInEthAmount.plus(swapQuoteInfo.totalTakerAssetAmount);
        const affiliateFeeAmount = ethAmount.multipliedBy(feePercentage);
        const ethAmountWithFees = ethAmount.plus(affiliateFeeAmount);
        return ethAmountWithFees;
    },
};
