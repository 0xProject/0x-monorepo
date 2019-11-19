import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import { SwapQuoterError } from '../types';

// tslint:disable:no-unnecessary-type-assertion
export const protocolFeeUtils = {
    /**
     * Gets 'fast' gas price from Eth Gas Station.
     */
    async getGasPriceEstimationOrThrowAsync(): Promise<BigNumber> {
        try {
            const res = await fetch(`${constants.ETH_GAS_STATION_API_BASE_URL}/json/ethgasAPI.json`);
            const gasInfo = await res.json();
            // Eth Gas Station result is gwei * 10
            // tslint:disable-next-line:custom-no-magic-numbers
            return new BigNumber(gasInfo.fast / 10);
        } catch (e) {
            throw new Error(SwapQuoterError.NoGasPriceProvidedOrEstimated);
        }
    },
    /**
     * Calculates protocol fee with protofol fee multiplier for each fill.
     */
    calculateWorstCaseProtocolFee<T extends Order>(orders: T[], gasPrice: BigNumber): BigNumber {
        const protocolFee = new BigNumber(orders.length * constants.PROTOCOL_FEE_MULTIPLIER).times(gasPrice);
        return protocolFee;
    },
};
