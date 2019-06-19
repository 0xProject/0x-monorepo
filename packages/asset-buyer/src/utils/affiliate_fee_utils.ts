import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { SwapQuote, SwapQuoteInfo } from '../types';

export const affiliateFeeUtils = {
    getSwapQuoteWithAffiliateFee(quote: SwapQuote, feePercentage: number): SwapQuote {
        const newQuote = _.clone(quote);
        newQuote.bestCaseQuoteInfo = getSwapQuoteInfoWithAffiliateFee(newQuote.bestCaseQuoteInfo, feePercentage);
        newQuote.worstCaseQuoteInfo = getSwapQuoteInfoWithAffiliateFee(newQuote.worstCaseQuoteInfo, feePercentage);
        return newQuote;
    },
};

const getSwapQuoteInfoWithAffiliateFee = (quoteInfo: SwapQuoteInfo, feePercentage: number): SwapQuoteInfo => {
    const newQuoteInfo = _.clone(quoteInfo);
    const affiliateFeeAmount = newQuoteInfo.takerTokenAmount
        .multipliedBy(feePercentage)
        .integerValue(BigNumber.ROUND_CEIL);
    const newFeeAmount = newQuoteInfo.feeTakerTokenAmount.plus(affiliateFeeAmount);
    newQuoteInfo.feeTakerTokenAmount = newFeeAmount;
    newQuoteInfo.totalTakerTokenAmount = newFeeAmount.plus(newQuoteInfo.takerTokenAmount);
    return newQuoteInfo;
};
