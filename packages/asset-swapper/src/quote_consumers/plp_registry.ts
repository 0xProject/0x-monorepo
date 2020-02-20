import { ContractFunctionObj } from '@0x/contract-wrappers';

import { constants } from '../constants';

export interface RegistryContract {
    getPoolForMarket(marketA: string, marketB: string): ContractFunctionObj<string>;
}

interface CacheValue {
    value?: string;
    cachedAt: number;
}

/**
 * A wrapper around the PLP Registry that includes a caching layer to minimize latency.
 */
export class PLPRegistry {
    private readonly _contract: RegistryContract;
    private readonly _cache: { [key: string]: CacheValue };

    /**
     * Instantiates a new PLPRegistry.
     * @param contract an instance of IPLPRouterContract
     */
    constructor(contract: RegistryContract) {
        this._contract = contract;
        this._cache = {};
    }

    /**
     * Returns the pool address for a given market (denoted by `xAsset` and `yAsset` pair)
     *
     * Pools are symmetrical and should yield the same pool address when xAsset and yAsset and swapped.
     * `getPoolForMarketAsync(tokenA, tokenB) === getPoolForMarketAsync(tokenB, tokenA)
     *
     * @param xAsset the first asset managed by the pool
     * @param yAsset the second asset managed by pool
     * @returns the pool address (represented as a string) if a pool is present for the given market, otherwise `undefined` if the
     *          pool was not found.
     */
    public async getPoolForMarketAsync(
        xAsset: string,
        yAsset: string,
        _currentTimestamp?: number | undefined,
    ): Promise<string | undefined> {
        const timestamp = _currentTimestamp || new Date().getTime();

        // We create a consistent ordering of `xAsset` and `yAsset` in order to create a consistent cache key.
        const cacheKey = JSON.stringify([xAsset, yAsset].sort());
        if (this._cache[cacheKey]) {
            const result = this._cache[cacheKey];

            // Cached values should only be valid for ONE_HOUR_IN_SECONDS from when the cache insertion was recorded.
            const secondsElapsed = (timestamp - result.cachedAt) / constants.ONE_SECOND_MS;
            if (secondsElapsed <= constants.ONE_HOUR_IN_SECONDS) {
                return result.value;
            }
        }
        let poolAddress: string | undefined;
        try {
            poolAddress = await this._contract.getPoolForMarket(xAsset, yAsset).callAsync();
        } catch (e) {
            const error: Error = e;

            // A call to getPoolForMarket() will revert with 'PLPRegistry/MARKET_PAIR_NOT_SET' when a pool is not found.
            // In this case, we want to simply return `undefined`.
            if (error.message !== 'PLPRegistry/MARKET_PAIR_NOT_SET') {
                throw e;
            }
        }
        this._cache[cacheKey] = {
            cachedAt: timestamp,
            value: poolAddress,
        };
        return poolAddress;
    }
}
