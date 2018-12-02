import axios from 'axios';
import { chain } from 'ramda';
import { Connection, Repository } from 'typeorm';

import { OHLCVExternal } from '../entities';

export interface TradingPair {
    fromSymbol: string;
    toSymbol: string;
    latest: number;
}

interface StaticPair {
    fromSymbol: string;
    toSymbol: string;
}

const COINLIST_API = 'https://min-api.cryptocompare.com/data/all/coinlist?BuiltOn=7605';

interface CryptoCompareCoinListResp {
    Data: Map<string, CryptoCompareCoin>;
}

interface CryptoCompareCoin {
    Symbol: string;
    BuiltOn: string;
    SmartContractAddress: string;
}

const TO_CURRENCIES = ['USD', 'EUR', 'ETH'];

/**
 * Get trading pairs with latest scraped time for OHLCV records
 * @param conn a typeorm Connection to postgres
 */
export async function fetchOHLCVTradingPairs(
    conn: Connection,
    source: string,
    earliestBackfillTime: number,
): Promise<TradingPair[]> {
    const rawTokenAddresses: Array<{ tokenaddress: string }> = await conn.query(
        `SELECT DISTINCT(maker_token_address) as tokenaddress FROM raw.exchange_fill_events UNION
        SELECT DISTINCT(taker_token_address) as tokenaddress FROM raw.exchange_fill_events
        LIMIT 1`,
    );
    const tokenAddresses = rawTokenAddresses.map(obj => obj.tokenaddress);

    // get token symbols used by Crypto Compare
    const allCoins = await axios.get<CryptoCompareCoinListResp>(COINLIST_API);
    const erc20Coins: Map<string, string> = new Map();
    Object.entries(allCoins.data.Data).forEach(pair => {
        const [k, v] = pair;
        if (v.BuiltOn === '7605' && v.SmartContractAddress !== 'N/A') {
            erc20Coins.set(v.SmartContractAddress, k);
        }
    });

    const mapFn = (tokenAddress: string): StaticPair[] => {
        return chain(fiat => {
            const fromSymbol = erc20Coins.get(tokenAddress);
            if (!!fromSymbol) {
                return [
                    {
                        toSymbol: fiat,
                        fromSymbol,
                    },
                ];
            } else {
                return [];
            }
        }, TO_CURRENCIES);
    };
    const tradingPairs: StaticPair[] = chain(mapFn, tokenAddresses);

    const tradingPairsLatestQuery: string = tradingPairs
        .map(pair => {
            return `SELECT
              case COUNT(*) when 0 then ${earliestBackfillTime} else MAX(end_time) end AS latest,
              '${pair.fromSymbol}' as from_symbol,
              '${pair.toSymbol}' as to_symbol
            FROM raw.ohlcv_external
            WHERE
              from_symbol = '${pair.fromSymbol}' AND
              to_symbol = '${pair.toSymbol}' AND
              source = '${source}'`;
        })
        .join('\nUNION\n');

    const latestTradingPairsResult: Array<{
        from_symbol: string;
        to_symbol: string;
        latest: string;
    }> = await conn.query(tradingPairsLatestQuery);

    const latestTradingPairs = latestTradingPairsResult.map(p => ({
        fromSymbol: p.from_symbol,
        toSymbol: p.to_symbol,
        latest: parseInt(p.latest),
    }));
    return latestTradingPairs;
}
