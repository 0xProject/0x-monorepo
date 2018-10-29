import { BigNumber } from '@0x/utils';

import { DEFAULT_GAS_PRICE, ETH_GAS_STATION_API_BASE_URL } from '../constants';

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

const fetchFastAmountInWei = async () => {
    const res = await fetch(`${ETH_GAS_STATION_API_BASE_URL}/json/ethgasAPI.json`);
    const gasInfo = (await res.json()) as EthGasStationResult;
    const gasPriceInGwei = new BigNumber(gasInfo.fast / 10);
    return gasPriceInGwei.mul(1000000000);
};

export class GasPriceEstimator {
    private _lastFetched?: BigNumber;
    public async getFastAmountInWeiAsync(): Promise<BigNumber> {
        let fetchedAmount: BigNumber | undefined;
        try {
            fetchedAmount = await fetchFastAmountInWei();
        } catch {
            fetchedAmount = undefined;
        }

        if (fetchedAmount) {
            this._lastFetched = fetchedAmount;
        }

        return fetchedAmount || this._lastFetched || DEFAULT_GAS_PRICE;
    }
}
export const gasPriceEstimator = new GasPriceEstimator();
