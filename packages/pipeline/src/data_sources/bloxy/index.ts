import axios from 'axios';
import * as R from 'ramda';

import { logUtils } from '@0x/utils';

// URL to use for getting dex trades from Bloxy.
export const BLOXY_DEX_TRADES_URL = 'https://bloxy.info/api/dex/trades';
// Number of trades to get at once. Must be less than or equal to MAX_OFFSET.
const TRADES_PER_QUERY = 10000;
// Maximum offset supported by the Bloxy API.
const MAX_OFFSET = 100000;
// Buffer to subtract from offset. This means we will request some trades twice
// but we have less chance on missing out on any data.
const OFFSET_BUFFER = 1000;
// Buffer used for comparing the last seen timestamp to the last returned
// timestamp. Increasing this reduces chances of data loss but also creates more
// redundancy and can impact performance.
// tslint:disable-next-line:custom-no-magic-numbers
const LAST_SEEN_TIMESTAMP_BUFFER_MS = 1000 * 60 * 30; // 30 minutes

export interface BloxyTrade {
    tx_hash: string;
    tx_time: string;
    tx_date: string;
    tx_sender: string;
    tradeIndex: string;
    smart_contract_id: number;
    smart_contract_address: string;
    contract_type: string;
    maker: string;
    taker: string;
    amountBuy: number;
    makerFee: number;
    buyCurrencyId: number;
    buySymbol: string;
    amountSell: number;
    takerFee: number;
    sellCurrencyId: number;
    sellSymbol: string;
    maker_annotation: string;
    taker_annotation: string;
    protocol: string;
    buyAddress: string | null;
    sellAddress: string | null;
}

interface BloxyError {
    error: string;
}

type BloxyResponse<T> = T | BloxyError;
type BloxyTradeResponse = BloxyResponse<BloxyTrade[]>;

function isError<T>(response: BloxyResponse<T>): response is BloxyError {
    return (response as BloxyError).error !== undefined;
}

export class BloxySource {
    private readonly _apiKey: string;

    constructor(apiKey: string) {
        this._apiKey = apiKey;
    }

    /**
     * Gets all latest trades between the lastSeenTimestamp (minus some buffer)
     * and the current time. Note that because the Bloxy API has some hard
     * limits it might not always be possible to get *all* the trades in the
     * desired time range.
     * @param lastSeenTimestamp The latest timestamp for trades that have
     * already been seen.
     */
    public async getDexTradesAsync(lastSeenTimestamp: number): Promise<BloxyTrade[]> {
        const allTrades = await this._scrapeAllDexTradesAsync(lastSeenTimestamp);
        logUtils.log(`Removing duplicates from ${allTrades.length} entries`);
        const uniqueTrades = R.uniqBy((trade: BloxyTrade) => `${trade.tradeIndex}-${trade.tx_hash}`, allTrades);
        logUtils.log(`Removed ${allTrades.length - uniqueTrades.length} duplicate entries`);
        return uniqueTrades;
    }

    // Potentially returns duplicate trades.
    private async _scrapeAllDexTradesAsync(lastSeenTimestamp: number): Promise<BloxyTrade[]> {
        let allTrades: BloxyTrade[] = [];

        // Keep getting trades until we hit one of the following conditions:
        //
        //  1. Offset hits MAX_OFFSET (we can't go back any further).
        //  2. There are no more trades in the response.
        //  3. We see a tx_time equal to or earlier than lastSeenTimestamp (plus
        //     some buffer).
        //
        for (let offset = 0; offset <= MAX_OFFSET; offset += TRADES_PER_QUERY - OFFSET_BUFFER) {
            const trades = await this._getTradesWithOffsetAsync(lastSeenTimestamp, offset);
            if (trades.length === 0) {
                // There are no more trades left for the days we are querying.
                // This means we are done.
                return allTrades;
            }
            const sortedTrades = R.reverse(R.sortBy(trade => trade.tx_time, trades));
            allTrades = allTrades.concat(sortedTrades);

            // Check if lastReturnedTimestamp < lastSeenTimestamp
            const lastReturnedTimestamp = new Date(sortedTrades[0].tx_time).getTime();
            if (lastReturnedTimestamp < lastSeenTimestamp - LAST_SEEN_TIMESTAMP_BUFFER_MS) {
                // We are at the point where we have already seen trades for the
                // timestamp range that is being returned. We're done.
                return allTrades;
            }
        }
        return allTrades;
    }

    private async _getTradesWithOffsetAsync(lastSeenTimestamp: number, offset: number): Promise<BloxyTrade[]> {
        const resp = await axios.get<BloxyTradeResponse>(BLOXY_DEX_TRADES_URL, {
            params: {
                key: this._apiKey,
                from_date: dateToISO8601ExtendedCalendarDateFormat(new Date(lastSeenTimestamp)),
                till_date: dateToISO8601ExtendedCalendarDateFormat(new Date()),
                limit: TRADES_PER_QUERY,
                offset,
            },
        });
        if (isError(resp.data)) {
            throw new Error(`Error in Bloxy API response: ${resp.data.error}`);
        }
        return resp.data;
    }
}

// Converts a Date object to the format like 'YYYY-MM-DD', which is expected by
// the Bloxy API for its from_date and till_date parameters.
function dateToISO8601ExtendedCalendarDateFormat(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
