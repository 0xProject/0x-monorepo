import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { MarketOperation, SwapQuote } from '../types';
import { ERC20BridgeSource } from '../utils/market_operation_utils/types';

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
    let slipRatio = new BigNumber(1);
    // Infer the allowed maker asset slippage from any non-native order.
    for (const o of quote.orders) {
        if (o.fills.length === 0 || o.fills[0].source === ERC20BridgeSource.Native) {
            // No slippage on native orders.
            continue;
        }
        const totalFillMakerAssetAmount = BigNumber.sum(...o.fills.map(f => f.output));
        slipRatio = o.fillableMakerAssetAmount.div(totalFillMakerAssetAmount);
        break;
    }
    if (slipRatio.gte(1)) {
        // No slippage allowed across all orders.
        return quote.bestCaseQuoteInfo.makerAssetAmount;
    }
    return quote.bestCaseQuoteInfo.makerAssetAmount.times(slipRatio).integerValue(BigNumber.ROUND_DOWN);
}
