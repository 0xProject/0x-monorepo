import { ContractFunctionObj } from '@0x/contract-wrappers';

import { constants } from '../constants';

export interface RegistryContract {
    getPoolForMarket(marketA: string, marketB: string): ContractFunctionObj<string>;
}

interface CacheValue {
    value?: string;
    cachedAt: number;
}

export class PLPRegistry {

    private readonly _contract: RegistryContract;
    private readonly _cache: {[key: string]: CacheValue};
    constructor(contract: RegistryContract) {
        this._contract = contract;
        this._cache = {};
    }

    public async getPoolForMarketAsync(addressA: string, addressB: string, currentTimestamp?: number| undefined): Promise<string | undefined> {
        const timestamp = currentTimestamp || new Date().getTime();

        const cacheKey = JSON.stringify([addressA, addressB].sort());
        if (this._cache[cacheKey]) {
            const result = this._cache[cacheKey];

            const secondsElapsed = (timestamp - result.cachedAt) / constants.ONE_SECOND_MS;
            if (secondsElapsed <= constants.ONE_HOUR_IN_SECONDS) {
                return result.value;
            }
        }
        let poolAddress: string | undefined;
        try {
            poolAddress = await this._contract.getPoolForMarket(addressA, addressB).callAsync();
        } catch (e) {
            const error: Error = e;
            if (error.message !== 'Market pair is not set') {
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
