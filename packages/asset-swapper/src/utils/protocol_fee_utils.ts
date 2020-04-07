import { BigNumber } from '@0x/utils';
import * as heartbeats from 'heartbeats';

import { constants } from '../constants';
import { SwapQuoterError } from '../types';

export class ProtocolFeeUtils {
    public gasPriceEstimation: BigNumber;
    private readonly _gasPriceHeart: any;

    constructor(gasPricePollingIntervalInMs: number, initialGasPrice: BigNumber = constants.ZERO_AMOUNT) {
        this._gasPriceHeart = heartbeats.createHeart(gasPricePollingIntervalInMs);
        this.gasPriceEstimation = initialGasPrice;
        this._initializeHeartBeat();
    }

    public async getGasPriceEstimationOrThrowAsync(shouldHardRefresh?: boolean): Promise<BigNumber> {
        if (this.gasPriceEstimation.eq(constants.ZERO_AMOUNT)) {
            return this._getGasPriceFromGasStationOrThrowAsync();
        }
        if (shouldHardRefresh) {
            return this._getGasPriceFromGasStationOrThrowAsync();
        } else {
            return this.gasPriceEstimation;
        }
    }

    /**
     * Destroys any subscriptions or connections.
     */
    public async destroyAsync(): Promise<void> {
        this._gasPriceHeart.kill();
    }

    // tslint:disable-next-line: prefer-function-over-method
    private async _getGasPriceFromGasStationOrThrowAsync(): Promise<BigNumber> {
        try {
            const res = await fetch(`${constants.ETH_GAS_STATION_API_BASE_URL}/json/ethgasAPI.json`);
            const gasInfo = await res.json();
            // Eth Gas Station result is gwei * 10
            // tslint:disable-next-line:custom-no-magic-numbers
            const BASE_TEN = 10;
            const gasPriceGwei = new BigNumber(gasInfo.fast / BASE_TEN);
            // tslint:disable-next-line:custom-no-magic-numbers
            const unit = new BigNumber(BASE_TEN).pow(9);
            const gasPriceWei = unit.times(gasPriceGwei);
            return gasPriceWei;
        } catch (e) {
            throw new Error(SwapQuoterError.NoGasPriceProvidedOrEstimated);
        }
    }

    private _initializeHeartBeat(): void {
        this._gasPriceHeart.createEvent(1, async () => {
            this.gasPriceEstimation = await this._getGasPriceFromGasStationOrThrowAsync();
        });
    }
}
