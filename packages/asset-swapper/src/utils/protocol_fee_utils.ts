import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import { SwapQuoterError } from '../types';

export class ProtocolFeeUtils {
    // tslint:disable-next-line:prefer-function-over-method
    public async getProtocolFeeMultiplierAsync(): Promise<BigNumber> {
        return new BigNumber(150000);
    }

    // tslint:disable-next-line: prefer-function-over-method
    public async getGasPriceEstimationOrThrowAsync(): Promise<BigNumber> {
        try {
            const res = await fetch(`${constants.ETH_GAS_STATION_API_BASE_URL}/json/ethgasAPI.json`);
            const gasInfo = await res.json();
            // Eth Gas Station result is gwei * 10
            // tslint:disable-next-line:custom-no-magic-numbers
            return new BigNumber(gasInfo.fast / 10);
        } catch (e) {
            throw new Error(SwapQuoterError.NoGasPriceProvidedOrEstimated);
        }
    }
    /**
     * Calculates protocol fee with protofol fee multiplier for each fill.
     */
    public async calculateWorstCaseProtocolFeeAsync<T extends Order>(
        orders: T[],
        gasPrice: BigNumber,
    ): Promise<BigNumber> {
        const protocolFeeMultiplier = await this.getProtocolFeeMultiplierAsync();
        const protocolFee = new BigNumber(orders.length).times(protocolFeeMultiplier).times(gasPrice);
        return protocolFee;
    }
}
