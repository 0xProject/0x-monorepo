import { BigNumber } from '@0x/utils';
import { bmath, getPoolsWithTokens, parsePoolData } from '@balancer-labs/sor';
import { Decimal } from 'decimal.js';

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

// tslint:disable:custom-no-magic-numbers
const FIVE_SECONDS_MS = 5 * 1000;
const DEFAULT_TIMEOUT_MS = 1000;
const MAX_POOLS_FETCHED = 2;
const Decimal20 = Decimal.clone({ precision: 20 });
// tslint:enable:custom-no-magic-numbers

export class BalancerPoolsCache {
    constructor(
        private readonly _cache: { [key: string]: CacheValue } = {},
        public cacheExpiryMs: number = FIVE_SECONDS_MS,
        private readonly maxPoolsFetched: number = MAX_POOLS_FETCHED,
    ) {}

    public async getPoolsForPairAsync(
        takerToken: string,
        makerToken: string,
        timeoutMs: number = DEFAULT_TIMEOUT_MS,
    ): Promise<BalancerPool[]> {
        const timeout = new Promise<BalancerPool[]>(resolve => setTimeout(resolve, timeoutMs, []));
        return Promise.race([this._getPoolsForPairAsync(takerToken, makerToken), timeout]);
    }

    protected async _getPoolsForPairAsync(takerToken: string, makerToken: string): Promise<BalancerPool[]> {
        const key = JSON.stringify([takerToken, makerToken]);
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
            // Sort by maker token balance (descending)
            const pools = parsePoolData(poolData, takerToken, makerToken).sort((a, b) =>
                b.balanceOut.minus(a.balanceOut).toNumber(),
            );
            return pools.length > this.maxPoolsFetched ? pools.slice(0, this.maxPoolsFetched) : pools;
        } catch (err) {
            return [];
        }
    }
}

// tslint:disable completed-docs
export function computeBalancerSellQuote(pool: BalancerPool, takerFillAmount: BigNumber): BigNumber {
    const weightRatio = pool.weightIn.dividedBy(pool.weightOut);
    const adjustedIn = bmath.BONE.minus(pool.swapFee)
        .dividedBy(bmath.BONE)
        .times(takerFillAmount);
    const y = pool.balanceIn.dividedBy(pool.balanceIn.plus(adjustedIn));
    const foo = Math.pow(y.toNumber(), weightRatio.toNumber());
    const bar = new BigNumber(1).minus(foo);
    const tokenAmountOut = pool.balanceOut.times(bar);
    return tokenAmountOut.integerValue();
}

export function computeBalancerBuyQuote(pool: BalancerPool, makerFillAmount: BigNumber): BigNumber {
    if (makerFillAmount.isGreaterThanOrEqualTo(pool.balanceOut)) {
        return new BigNumber(0);
    }
    const weightRatio = pool.weightOut.dividedBy(pool.weightIn);
    const diff = pool.balanceOut.minus(makerFillAmount);
    const y = pool.balanceOut.dividedBy(diff);
    let foo: number | Decimal = Math.pow(y.toNumber(), weightRatio.toNumber()) - 1;
    if (!Number.isFinite(foo)) {
        foo = new Decimal20(y.toString()).pow(weightRatio.toString()).minus(1);
    }
    let tokenAmountIn = bmath.BONE.minus(pool.swapFee).dividedBy(bmath.BONE);
    tokenAmountIn = pool.balanceIn.times(foo.toString()).dividedBy(tokenAmountIn);
    return tokenAmountIn.integerValue();
}
