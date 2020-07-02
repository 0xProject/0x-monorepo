import { BigNumber } from '@0x/utils';
import { bmath, getPoolsWithTokens, parsePoolData } from '@balancer-labs/sor';
import * as _ from 'lodash';

export interface BalancerPool {
    id: string;
    balanceIn: BigNumber;
    balanceOut: BigNumber;
    weightIn: BigNumber;
    weightOut: BigNumber;
    swapFee: BigNumber;
    spotPrice?: BigNumber;
    slippage?: BigNumber;
    limitAmount?: BigNumber;
}
interface CacheValue {
    timestamp: number;
    pools: BalancerPool[];
}
const THIRTY_MINUTES_MS = 30 * 60 * 1000; // tslint:disable-line:custom-no-magic-numbers
export class BalancerPoolsCache {
    constructor(private readonly _cache: {[key: string]: CacheValue} = {}, public cacheExpiryMs: number = THIRTY_MINUTES_MS) {}
    public async getPoolsForPairAsync(takerToken: string, makerToken: string): Promise<BalancerPool[]> {
        const key = JSON.stringify([takerToken, makerToken].sort());
        const value = this._cache[key];
        const minTimestamp = new Date().getTime() - this.cacheExpiryMs;
        if (value.timestamp < minTimestamp ) {
            const pools = await this._fetchPoolsForPairAsync(takerToken, makerToken);
            const timestamp = new Date().getTime();
            this._cache[key] = {
                pools,
                timestamp,
            };
        }
        return this._cache[key].pools;
    }

    // tslint:disable-next-line:prefer-function-over-method
    private async _fetchPoolsForPairAsync(takerToken: string, makerToken: string): Promise<BalancerPool[]> {
        try {
            return parsePoolData(await getPoolsWithTokens(takerToken, makerToken), takerToken, makerToken);
        } catch (err) {
            return [];
        }
    }
}

export function computeBalancerSellQuote(pool: BalancerPool, takerFillAmount: BigNumber): BigNumber {
    return bmath.calcOutGivenIn(
        pool.balanceIn,
        pool.weightIn,
        pool.balanceOut,
        pool.weightOut,
        takerFillAmount,
        pool.swapFee,
    );
}

export function computeBalancerBuyQuote(pool: BalancerPool, makerFillAmount: BigNumber): BigNumber {
    return bmath.calcInGivenOut(
        pool.balanceIn,
        pool.weightIn,
        pool.balanceOut,
        pool.weightOut,
        makerFillAmount,
        pool.swapFee,
    );
}
