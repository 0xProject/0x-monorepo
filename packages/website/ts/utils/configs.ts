import * as _ from 'lodash';
import {
    Environments,
    OutdatedWrappedEtherByNetworkId,
} from 'ts/types';

const BASE_URL = window.location.origin;
const isDevelopment = _.includes(BASE_URL, 'https://0xproject.dev:3572') ||
                      _.includes(BASE_URL, 'https://localhost:3572') ||
                      _.includes(BASE_URL, 'https://127.0.0.1');

export const configs = {
    BASE_URL,
    ENVIRONMENT: isDevelopment ? Environments.DEVELOPMENT : Environments.PRODUCTION,
    BACKEND_BASE_URL: isDevelopment ? 'https://localhost:3001' : 'https://website-api.0xproject.com',
    symbolsOfMintableTokens: ['MKR', 'MLN', 'GNT', 'DGD', 'REP'],
    // WARNING: ZRX & WETH MUST always be default trackedTokens
    defaultTrackedTokenSymbols: ['WETH', 'ZRX'],
    lastLocalStorageFillClearanceDate: '2017-11-22',
    lastLocalStorageTrackedTokenClearanceDate: '2017-12-13',
    isMainnetEnabled: true,
    shouldDeprecateOldWethToken: true,
    // newWrappedEthers is temporary until we remove the shouldDeprecateOldWethToken flag
    // and add the new WETHs to the tokenRegistry
    newWrappedEthers: {
        1: '0xe495bcacaf29a0eb00fb67b86e9cd2a994dd55d8',
        42: '0x739e78d6bebbdf24105a5145fa04436589d1cbd9',
    } as {[networkId: string]: string},
    outdatedWrappedEthers: [
        {
            42: {
                address: '0x05d090b51c40b020eab3bfcb6a2dff130df22e9c',
                timestampMsRange: {
                    startTimestampMs: 1501614680000,
                    endTimestampMs: 1513106129000,
                },
            },
            1: {
                address: '0x2956356cd2a2bf3202f771f50d3d14a367b48070',
                timestampMsRange: {
                    startTimestampMs: 1513123415000,
                    endTimestampMs: 1513106129000,
                },
            },
        },
    ] as OutdatedWrappedEtherByNetworkId[],
};
