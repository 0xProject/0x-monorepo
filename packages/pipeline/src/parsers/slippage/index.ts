import { BigNumber } from '@0x/utils';
import * as R from 'ramda';

import { EdpsExchange } from '../../data_sources/slippage';
import { Slippage } from '../../entities';
import { symbol } from 'prop-types';

/**
 * Calculates slippage and returns Slippage entity.
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
        const slippage = new Slippage();
        if (b && s && b.avgPrice && s.avgPrice) {
            slippage.observedTimestamp = b.timestamp;
            slippage.symbol = b.tokenSymbol;
            slippage.exchange = exchange;
            slippage.usdAmount = usdAmount;
            slippage.tokenAmount = Number(b.tokenAmount); // API returns a string
            slippage.avgPriceInEthBuy = b.avgPrice;
            slippage.avgPriceInEthSell = s.avgPrice;
            slippage.slippage = (b.avgPrice - s.avgPrice) / b.avgPrice;
            
        }
        return slippage;
    }
