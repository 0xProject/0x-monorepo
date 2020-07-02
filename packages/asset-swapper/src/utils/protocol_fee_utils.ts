import { BigNumber } from '@0x/utils';
import * as heartbeats from 'heartbeats';

import { constants } from '../constants';
import { SwapQuoterError } from '../types';

const MAX_ERROR_COUNT = 5;

export class ProtocolFeeUtils {
    private static _instance: ProtocolFeeUtils;
    private readonly _ethGasStationUrl!: string;
    private readonly _gasPriceHeart: any;
    private _gasPriceEstimation: BigNumber = constants.ZERO_AMOUNT;
    private _errorCount: number = 0;

    public static getInstance(
        gasPricePollingIntervalInMs: number,
        ethGasStationUrl: string = constants.ETH_GAS_STATION_API_URL,
        initialGasPrice: BigNumber = constants.ZERO_AMOUNT,
    ): ProtocolFeeUtils {
        if (!ProtocolFeeUtils._instance) {
            ProtocolFeeUtils._instance = new ProtocolFeeUtils(
                gasPricePollingIntervalInMs,
                ethGasStationUrl,
                initialGasPrice,
            );
        }
        return ProtocolFeeUtils._instance;
    }

    public async getGasPriceEstimationOrThrowAsync(shouldHardRefresh?: boolean): Promise<BigNumber> {
        if (this._gasPriceEstimation.eq(constants.ZERO_AMOUNT)) {
            return this._getGasPriceFromGasStationOrThrowAsync();
        }
        if (shouldHardRefresh) {
            return this._getGasPriceFromGasStationOrThrowAsync();
        } else {
            return this._gasPriceEstimation;
        }
    }

    /**
     * Destroys any subscriptions or connections.
     */
    public async destroyAsync(): Promise<void> {
        this._gasPriceHeart.kill();
    }

    private constructor(
        gasPricePollingIntervalInMs: number,
        ethGasStationUrl: string = constants.ETH_GAS_STATION_API_URL,
        initialGasPrice: BigNumber = constants.ZERO_AMOUNT,
    ) {
        this._gasPriceHeart = heartbeats.createHeart(gasPricePollingIntervalInMs);
        this._gasPriceEstimation = initialGasPrice;
        this._ethGasStationUrl = ethGasStationUrl;
        this._initializeHeartBeat();
    }

    // tslint:disable-next-line: prefer-function-over-method
    private async _getGasPriceFromGasStationOrThrowAsync(): Promise<BigNumber> {
        try {
            const res = await fetch(this._ethGasStationUrl);
            const gasInfo = await res.json();
            // Eth Gas Station result is gwei * 10
            // tslint:disable-next-line:custom-no-magic-numbers
            const BASE_TEN = 10;
            const gasPriceGwei = new BigNumber(gasInfo.fast / BASE_TEN);
            // tslint:disable-next-line:custom-no-magic-numbers
            const unit = new BigNumber(BASE_TEN).pow(9);
            const gasPriceWei = unit.times(gasPriceGwei);
            // Reset the error count to 0 once we have a successful response
            this._errorCount = 0;
            return gasPriceWei;
        } catch (e) {
            this._errorCount++;
            // If we've reached our max error count then throw
            if (this._errorCount > MAX_ERROR_COUNT || this._gasPriceEstimation.isZero()) {
                this._errorCount = 0;
                throw new Error(SwapQuoterError.NoGasPriceProvidedOrEstimated);
            }
            return this._gasPriceEstimation;
        }
    }

    private _initializeHeartBeat(): void {
        this._gasPriceHeart.createEvent(1, async () => {
            this._gasPriceEstimation = await this._getGasPriceFromGasStationOrThrowAsync();
        });
    }
}
