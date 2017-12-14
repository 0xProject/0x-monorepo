import * as _ from 'lodash';
import {
    Environments,
    OutdatedWrappedEtherByNetworkId,
    TimestampMsRange,
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
