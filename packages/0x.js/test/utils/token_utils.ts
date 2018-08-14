import { artifacts } from '../../src/artifacts';

import { constants } from './constants';

export const tokenUtils = {
    getProtocolTokenAddress(): string {
        return artifacts.ZRXToken.networks[constants.TESTRPC_NETWORK_ID].address;
    },
};
