import { BigNumber } from '@0x/utils';

import { EdpsExchange } from '../../data_sources/dex_prices';
import { Slippage } from '../../entities';

/**
 * Calculates slippage and returns Slippage entity.
 *
 * @param usdAmount Amount to buy/sell in USD.
 * @param exchange Exchange where we are calculating slippage.
 * @param buyEdps Ethereum DEX price service object for buy side.
 * @param sellEdps Ethereum DEX price service object for sell side.
 *
 */

export function calculateSlippage(
    usdAmount: number,
    exchange: string,
    buyEdps: Map<string, EdpsExchange>,
    sellEdps: Map<string, EdpsExchange>,
): Slippage {
    const b = buyEdps.get(exchange);
    const s = sellEdps.get(exchange);
    const slippage = new Slippage();
    if (b && s && b.avgPrice && s.avgPrice) {
        slippage.observedTimestamp = b.timestamp;
        slippage.symbol = b.tokenSymbol;
        slippage.exchange = exchange;
        slippage.usdAmount = new BigNumber(usdAmount);
        slippage.tokenAmount = new BigNumber(Number(b.tokenAmount)); // API returns a string
        slippage.avgPriceInEthBuy = new BigNumber(b.avgPrice);
        slippage.avgPriceInEthSell = new BigNumber(s.avgPrice);
        slippage.slippage = new BigNumber((b.avgPrice - s.avgPrice) / b.avgPrice);
    }
    return slippage;
}
