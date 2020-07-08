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
    constructor(
        private readonly _cache: { [key: string]: CacheValue } = {},
        public cacheExpiryMs: number = THIRTY_MINUTES_MS,
    ) {}
    public async getPoolsForPairAsync(takerToken: string, makerToken: string): Promise<BalancerPool[]> {
        const key = JSON.stringify([takerToken, makerToken].sort());
        const value = this._cache[key];
        const minTimestamp = Date.now() - this.cacheExpiryMs;
        if (value === undefined || value.timestamp < minTimestamp) {
            const pools = await this._fetchPoolsForPairAsync(takerToken, makerToken);
            const timestamp = Date.now();
            this._cache[key] = {
                pools,
                timestamp,
            };
        }
        return this._cache[key].pools;
    }

    // tslint:disable-next-line:prefer-function-over-method
    protected async _fetchPoolsForPairAsync(takerToken: string, makerToken: string): Promise<BalancerPool[]> {
        try {
            const poolData = (await getPoolsWithTokens(takerToken, makerToken)).pools;
            return parsePoolData(poolData, takerToken, makerToken);
        } catch (err) {
            return [];
        }
    }
}

// tslint:disable completed-docs
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
    if (makerFillAmount.isGreaterThanOrEqualTo(pool.balanceOut)) {
        return new BigNumber(0);
    }
    return bmath.calcInGivenOut(
        pool.balanceIn,
        pool.weightIn,
        pool.balanceOut,
        pool.weightOut,
        makerFillAmount,
        pool.swapFee,
    );
}
