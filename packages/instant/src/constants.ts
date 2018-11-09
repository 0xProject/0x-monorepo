import { BigNumber } from '@0x/utils';

import { AccountNotReady, AccountState, Network } from './types';

export const BIG_NUMBER_ZERO = new BigNumber(0);
export const ETH_DECIMALS = 18;
export const DEFAULT_ZERO_EX_CONTAINER_SELECTOR = '#zeroExInstantContainer';
export const INJECTED_DIV_CLASS = 'zeroExInstantResetRoot';
export const INJECTED_DIV_ID = 'zeroExInstant';
export const WEB_3_WRAPPER_TRANSACTION_FAILED_ERROR_MSG_PREFIX = 'Transaction failed';
export const GWEI_IN_WEI = new BigNumber(1000000000);
export const ONE_SECOND_MS = 1000;
export const ONE_MINUTE_MS = ONE_SECOND_MS * 60;
export const DEFAULT_GAS_PRICE = GWEI_IN_WEI.mul(6);
export const DEFAULT_ESTIMATED_TRANSACTION_TIME_MS = ONE_MINUTE_MS * 2;
export const ETH_GAS_STATION_API_BASE_URL = 'https://ethgasstation.info';
export const COINBASE_API_BASE_URL = 'https://api.coinbase.com/v2';
export const PROGRESS_STALL_AT_WIDTH = '95%';
export const PROGRESS_FINISH_ANIMATION_TIME_MS = 200;
export const ETHEREUM_NODE_URL_BY_NETWORK = {
    [Network.Mainnet]: 'https://mainnet.infura.io/',
    [Network.Kovan]: 'https://kovan.infura.io/',
};
export const BLOCK_POLLING_INTERVAL_MS = 10000; // 10s
export const NO_ACCOUNT: AccountNotReady = {
    state: AccountState.None,
};
export const LOADING_ACCOUNT: AccountNotReady = {
    state: AccountState.Loading,
};
export const LOCKED_ACCOUNT: AccountNotReady = {
    state: AccountState.Locked,
};
export const ERROR_ACCOUNT: AccountNotReady = {
    state: AccountState.Error,
};
