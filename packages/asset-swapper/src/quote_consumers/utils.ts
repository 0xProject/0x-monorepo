import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { MarketOperation, SwapQuote } from '../types';
import { ERC20BridgeSource } from '../utils/market_operation_utils/types';
import { constants } from '../constants';

const { ZERO_AMOUNT } = constants;

/**
 * Compute the mminimum buy token amount for market operations by inferring
 * the slippage from the orders in a quote. We cannot rely on
 * `worstCaseQuoteInfo.makerAssetAmount` because that does not stop at
 * maximum slippage.
 */
export function getSwapMinBuyAmount(quote: SwapQuote): BigNumber {
    if (quote.type === MarketOperation.Buy || quote.isTwoHop) {
        return quote.worstCaseQuoteInfo.makerAssetAmount;
    }
    // Infer the allowed maker asset slippage from the orders.
    const totalOrderMakerAssetAmount = BigNumber.sum(...quote.orders.map(o => o.fillableMakerAssetAmount));
    let totalFillMakerAssetAmount = ZERO_AMOUNT;
    for (const o of quote.orders) {
        if (o.fills.length === 0 || o.fills[0].source === ERC20BridgeSource.Native) {
            // No slippage on natuve orders.
            totalFillMakerAssetAmount = totalFillMakerAssetAmount.plus(o.fillableMakerAssetAmount);
        } else {
            totalFillMakerAssetAmount = totalFillMakerAssetAmount.plus(BigNumber.sum(...o.fills.map(f => f.output)));
        }
    }
    if (totalOrderMakerAssetAmount.eq(totalFillMakerAssetAmount)) {
        // No slippage allowed across all orders.
        return quote.bestCaseQuoteInfo.makerAssetAmount;
    }
    const slipRatio = totalOrderMakerAssetAmount.div(totalFillMakerAssetAmount);
    console.log(slipRatio);
    return quote.bestCaseQuoteInfo.makerAssetAmount.times(slipRatio).integerValue(BigNumber.ROUND_DOWN);
}
