import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { SwapQuote, SwapQuoteInfo, SwapQuoteWithAffiliateFee } from '../types';

export const affiliateFeeUtils = {
    getSwapQuoteWithAffiliateFee(quote: SwapQuote, feePercentage: number): SwapQuoteWithAffiliateFee {
        const newQuote = _.clone(quote);
        newQuote.bestCaseQuoteInfo = getSwapQuoteInfoWithAffiliateFee(newQuote.bestCaseQuoteInfo, feePercentage);
        newQuote.worstCaseQuoteInfo = getSwapQuoteInfoWithAffiliateFee(newQuote.worstCaseQuoteInfo, feePercentage);
        return { ...newQuote, ...{ feePercentage } };
    },
};

/**
 * Adds a fee based on feePercentage of the takerTokenAmount and adds it to the feeTakerTokenAmount and totalTakerTokenAmount
 * @param quoteInfo quote information to add fee to
 * @param feePercentage the percentage of takerTokenAmount charged additionally as a fee
 */
const getSwapQuoteInfoWithAffiliateFee = (quoteInfo: SwapQuoteInfo, feePercentage: number): SwapQuoteInfo => {
    const newQuoteInfo = _.clone(quoteInfo);
    const affiliateFeeAmount = quoteInfo.takerTokenAmount
        .multipliedBy(feePercentage)
        .integerValue(BigNumber.ROUND_CEIL);
    const newFeeAmount = quoteInfo.feeTakerTokenAmount.plus(affiliateFeeAmount);
    newQuoteInfo.feeTakerTokenAmount = newFeeAmount;
    newQuoteInfo.totalTakerTokenAmount = newFeeAmount.plus(quoteInfo.takerTokenAmount);
    return newQuoteInfo;
};
