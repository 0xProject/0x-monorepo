import * as _ from 'lodash';
import {Environments} from 'ts/types';

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
    isMainnetEnabled: true,
};
