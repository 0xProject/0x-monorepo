import { BigNumber } from '@0x/utils';
import * as R from 'ramda';

import { EdpsExchange } from '../../data_sources/slippage';
import { SlippageRecord } from '../../entities';
import { symbol } from 'prop-types';

/**
 * Calculates slippage and returns SlippageRecord entity.
 * 
 * @param usdAmount
 * @param exchange
 * @param buyEdps
 * @param sellEdps
 */

 export function calculateSlippage(usdAmount: number, exchange: string, 
    buyEdps: Map<string, EdpsExchange>, sellEdps: Map<string, EdpsExchange>) {
        const b = buyEdps.get(exchange);
        const s = sellEdps.get(exchange);
        if (b && s && b.avgPrice && s.avgPrice) {
            var slippage = (b.avgPrice - s.avgPrice) / b.avgPrice;
            const observedTimestamp = Date.now();
            const slippageRecord = new SlippageRecord();
            slippageRecord.time = observedTimestamp;
            slippageRecord.symbol = b.tokenSymbol;
            slippageRecord.exchange = exchange;
            slippageRecord.usdAmount = usdAmount;
            slippageRecord.slippage = slippage;
            return slippageRecord;
        }
        else {
            return null;
        }
    }
