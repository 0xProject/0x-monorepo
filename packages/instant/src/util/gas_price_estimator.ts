import { BigNumber, fetchAsync } from '@0x/utils';

import {
    DEFAULT_ESTIMATED_TRANSACTION_TIME_MS,
    DEFAULT_GAS_PRICE,
    ETH_GAS_STATION_API_BASE_URL,
    GWEI_IN_WEI,
} from '../constants';

interface EthGasStationResult {
    average: number;
    fastestWait: number;
    fastWait: number;
    fast: number;
    safeLowWait: number;
    blockNum: number;
    avgWait: number;
    block_time: number;
    speed: number;
    fastest: number;
    safeLow: number;
}

interface GasInfo {
    gasPriceInWei: BigNumber;
    estimatedTimeMs: number;
}

const fetchFastAmountInWeiAsync = async (): Promise<GasInfo> => {
    const res = await fetchAsync(`${ETH_GAS_STATION_API_BASE_URL}/json/ethgasAPI.json`);
    const gasInfo = (await res.json()) as EthGasStationResult;
    // Eth Gas Station result is gwei * 10
    const gasPriceInGwei = new BigNumber(gasInfo.fast / 10);
    // Time is in minutes
    const estimatedTimeMs = gasInfo.fastWait * 60 * 1000; // Minutes to MS
    return { gasPriceInWei: gasPriceInGwei.mul(GWEI_IN_WEI), estimatedTimeMs };
};

export class GasPriceEstimator {
    private _lastFetched?: GasInfo;
    public async getGasInfoAsync(): Promise<GasInfo> {
        let fetchedAmount: GasInfo | undefined;
        try {
            fetchedAmount = await fetchFastAmountInWeiAsync();
        } catch {
            fetchedAmount = undefined;
        }

        if (fetchedAmount) {
            this._lastFetched = fetchedAmount;
        }

        return (
            fetchedAmount ||
            this._lastFetched || {
                gasPriceInWei: DEFAULT_GAS_PRICE,
                estimatedTimeMs: DEFAULT_ESTIMATED_TRANSACTION_TIME_MS,
            }
        );
    }
}
export const gasPriceEstimator = new GasPriceEstimator();
