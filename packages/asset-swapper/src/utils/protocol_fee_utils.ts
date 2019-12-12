import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as heartbeats from 'heartbeats';
import * as _ from 'lodash';

import { constants } from '../constants';
import { SwapQuoterError } from '../types';

export class ProtocolFeeUtils {

    public gasPriceEstimation: BigNumber;
    private readonly _gasPriceHeart: any;

    constructor(gasPricePollingIntervalInMs: number) {
        this._gasPriceHeart = heartbeats.createHeart(gasPricePollingIntervalInMs);
        this.gasPriceEstimation = constants.ZERO_AMOUNT;
        this._initializeHeartBeat();
    }

    // tslint:disable-next-line:prefer-function-over-method
    public getProtocolFeeMultiplier(): BigNumber {
        return new BigNumber(150000);
    }

    // tslint:disable-next-line: prefer-function-over-method
    public async getGasPriceEstimationOrThrowAsync(shouldHardRefresh?: boolean): Promise<BigNumber> {
        if (shouldHardRefresh) {
            return this._getGasPriceFromGasStationOrThrowAsync();
        } else {
            return Promise.resolve(this.gasPriceEstimation);
        }
    }

    /**
     * Destroys any subscriptions or connections.
     */
    public async destroyAsync(): Promise<void> {
        this._gasPriceHeart.kill();
        return Promise.resolve();
    }

    /**
     * Calculates protocol fee with protofol fee multiplier for each fill.
     */
    public calculateWorstCaseProtocolFee<T extends Order>(
        orders: T[],
        gasPrice: BigNumber,
    ): BigNumber {
        const protocolFeeMultiplier = this.getProtocolFeeMultiplier();
        const protocolFee = new BigNumber(orders.length).times(protocolFeeMultiplier).times(gasPrice);
        return protocolFee;
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
            const unit = new BigNumber(BASE_TEN).pow(BASE_TEN);
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
