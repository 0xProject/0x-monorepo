import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
export declare class ProtocolFeeUtils {
    gasPriceEstimation: BigNumber;
    private readonly _gasPriceHeart;
    constructor(gasPricePollingIntervalInMs: number, initialGasPrice?: BigNumber);
    getProtocolFeeMultiplierAsync(): Promise<BigNumber>;
    getGasPriceEstimationOrThrowAsync(shouldHardRefresh?: boolean): Promise<BigNumber>;
    /**
     * Destroys any subscriptions or connections.
     */
    destroyAsync(): Promise<void>;
    /**
     * Calculates protocol fee with protofol fee multiplier for each fill.
     */
    calculateWorstCaseProtocolFeeAsync<T extends Order>(orders: T[], gasPrice: BigNumber): Promise<BigNumber>;
    private _getGasPriceFromGasStationOrThrowAsync;
    private _initializeHeartBeat;
}
//# sourceMappingURL=protocol_fee_utils.d.ts.map