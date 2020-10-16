import { getPoolsWithTokens, parsePoolData } from 'cream-sor';

import { BalancerPool } from './balancer_utils';

// tslint:disable:boolean-naming

interface CacheValue {
    timestamp: number;
    pools: BalancerPool[];
}

// tslint:disable:custom-no-magic-numbers
const FIVE_SECONDS_MS = 5 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 1000;
const MAX_POOLS_FETCHED = 3;
// tslint:enable:custom-no-magic-numbers

export class CreamPoolsCache {
    constructor(
        private readonly _cache: { [key: string]: CacheValue } = {},
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

    public getCachedPoolAddressesForPair(
        takerToken: string,
        makerToken: string,
        cacheExpiryMs?: number,
    ): string[] | undefined {
        const key = JSON.stringify([takerToken, makerToken]);
        const value = this._cache[key];
        if (cacheExpiryMs === undefined) {
            return value === undefined ? [] : value.pools.map(pool => pool.id);
        }
        const minTimestamp = Date.now() - cacheExpiryMs;
        if (value === undefined || value.timestamp < minTimestamp) {
            return undefined;
        } else {
            return value.pools.map(pool => pool.id);
        }
    }

    public howToSampleCream(
        takerToken: string,
        makerToken: string,
        isAllowedSource: boolean,
    ): { onChain: boolean; offChain: boolean } {
        // If CREAM is excluded as a source, do not sample.
        if (!isAllowedSource) {
            return { onChain: false, offChain: false };
        }
        const cachedCreamPools = this.getCachedPoolAddressesForPair(takerToken, makerToken, ONE_DAY_MS);
        // Sample CREAM on-chain (i.e. via the ERC20BridgeSampler contract) if:
        // - Cached values are not stale
        // - There is at least one CREAM pool for this pair
        const onChain = cachedCreamPools !== undefined && cachedCreamPools.length > 0;
        // Sample CREAM off-chain (i.e. via GraphQL query + `computeCreamBuy/SellQuote`)
        // if cached values are stale
        const offChain = cachedCreamPools === undefined;
        return { onChain, offChain };
    }

    protected async _getPoolsForPairAsync(
        takerToken: string,
        makerToken: string,
        cacheExpiryMs: number = FIVE_SECONDS_MS,
    ): Promise<BalancerPool[]> {
        const key = JSON.stringify([takerToken, makerToken]);
        const value = this._cache[key];
        const minTimestamp = Date.now() - cacheExpiryMs;
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
