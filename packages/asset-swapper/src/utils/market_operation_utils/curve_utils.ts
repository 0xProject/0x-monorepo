import * as _ from 'lodash';

import { MAINNET_CURVE_CONTRACTS } from './constants';

export const getCurveAddressesForPair = (takerToken: string, makerToken: string): string[] => {
    return Object.keys(
        _.pickBy(MAINNET_CURVE_CONTRACTS, tokens => tokens.includes(takerToken) && tokens.includes(makerToken)),
    );
};
