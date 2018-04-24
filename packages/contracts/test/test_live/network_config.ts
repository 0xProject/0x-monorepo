import { devConstants } from '@0xproject/dev-utils';

import { constants } from '../../src/utils/constants';

const gasPrice = 50;
export const KovanConfig = {
    name: 'Kovan',
    networkId: 42,
    providerConfig: { rpcUrl: 'https://kovan.infura.io/' },
    gasEstimate: 4701624,
    gasPrice,
};
export const GanacheConfig = {
    name: 'Testrpc',
    networkId: constants.TESTRPC_NETWORK_ID,
    providerConfig: { shouldUseInProcessGanache: true },
    gasEstimate: devConstants.GAS_ESTIMATE,
    gasPrice,
};
