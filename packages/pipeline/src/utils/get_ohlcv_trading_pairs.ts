import { fetchAsync } from '@0x/utils';
import axios from 'axios';
import * as R from 'ramda';
import { Connection } from 'typeorm';

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

const TO_CURRENCIES = ['USD', 'EUR', 'ETH', 'USDT'];
const ETHEREUM_IDENTIFIER = '7605';
const HTTP_OK_STATUS = 200;
/**
 * Get trading pairs with latest scraped time for OHLCV records
 * @param conn a typeorm Connection to postgres
 */
export async function fetchOHLCVTradingPairsAsync(
    conn: Connection,
    source: string,
    earliestBackfillTime: number,
): Promise<TradingPair[]> {
    const latestTradingPairsQuery: string = `SELECT
  MAX(end_time) as latest,
  from_symbol,
  to_symbol
  FROM raw.ohlcv_external
  GROUP BY from_symbol, to_symbol;`;

    const latestTradingPairs = await queryAsync<Array<{ from_symbol: string; to_symbol: string; latest: number }>>(
        conn,
        latestTradingPairsQuery,
    );

    const latestTradingPairsIndex = new Map<string, Map<string, number>>();
    latestTradingPairs.forEach(pair => {
        const latestIndex = latestTradingPairsIndex.get(pair.from_symbol) || new Map<string, number>();
        latestIndex.set(pair.to_symbol, pair.latest);
        latestTradingPairsIndex.set(pair.from_symbol, latestIndex);
    });

    // get token symbols used by Crypto Compare
    const allCoinsResp = await fetchAsync(COINLIST_API);
    if (allCoinsResp.status !== HTTP_OK_STATUS) {
        return [];
    }
    const allCoins: CryptoCompareCoinListResp = await allCoinsResp.json();
    const erc20CoinsIndex: Map<string, string> = new Map();
    Object.entries(allCoins.Data).forEach(pair => {
        const [symbol, coinData] = pair;
        if (coinData.BuiltOn === ETHEREUM_IDENTIFIER && coinData.SmartContractAddress !== 'N/A') {
            erc20CoinsIndex.set(coinData.SmartContractAddress, symbol);
        }
    });

    // fetch all tokens that are traded on 0x
    const rawTokenAddresses: Array<{ tokenaddress: string }> = await conn.query(
        `SELECT DISTINCT(maker_token_address) as tokenaddress FROM raw.exchange_fill_events UNION
      SELECT DISTINCT(taker_token_address) as tokenaddress FROM raw.exchange_fill_events
      LIMIT 1`,
    );
    const tokenAddresses = R.pluck('tokenaddress', rawTokenAddresses);

    const allTokenSymbols: string[] = tokenAddresses
        .map(tokenAddress => erc20CoinsIndex.get(tokenAddress) || '')
        .filter(x => x);

    const allTradingPairCombinations: TradingPair[] = R.chain(sym => {
        return TO_CURRENCIES.map(fiat => {
            return {
                fromSymbol: sym,
                toSymbol: fiat,
                latest: R.path<number>([sym, fiat], latestTradingPairsIndex) || earliestBackfillTime,
            };
        });
    }, allTokenSymbols);

    return allTradingPairCombinations;
}

async function queryAsync<T>(conn: Connection, query: string): Promise<T> {
    return conn.query(query);
}
