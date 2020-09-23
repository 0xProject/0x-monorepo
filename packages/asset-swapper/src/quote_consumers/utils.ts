import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { MarketOperation, SwapQuote } from '../types';

/**
 * Compute the mminimum buy token amount for market operations by inferring
 * the slippage from the orders in a quote. We cannot rely on
 * `worstCaseQuoteInfo.makerAssetAmount` because that does not stop at
 * maximum slippage.
 */
export function getMinBuyAmount(quote: SwapQuote): BigNumber {
    // Infer the allowed maker asset slippage from the orders.
    const totalOrderMakerAssetAmount = BigNumber.sum(...quote.orders.map(o => o.makerAssetAmount));
    const totalFillMakerAssetAmount =
        quote.type === MarketOperation.Sell
            ? BigNumber.sum(...quote.orders.map(o => BigNumber.sum(0, ...o.fills.map(f => f.output))))
            : BigNumber.sum(...quote.orders.map(o => BigNumber.sum(0, ...o.fills.map(f => f.input))));
    if (totalFillMakerAssetAmount.eq(0)) {
        return quote.worstCaseQuoteInfo.makerAssetAmount;
    }
    if (totalOrderMakerAssetAmount.eq(totalFillMakerAssetAmount)) {
        // No slippage allowed on bought tokens.
        return quote.bestCaseQuoteInfo.makerAssetAmount;
    }
    const slipRatio = totalOrderMakerAssetAmount.div(totalFillMakerAssetAmount);
    return quote.bestCaseQuoteInfo.makerAssetAmount.times(slipRatio).integerValue(BigNumber.ROUND_DOWN);
}
