import { BigNumber } from '@0x/utils';
export const BIG_NUMBER_ZERO = new BigNumber(0);
export const ETH_DECIMALS = 18;
export const DEFAULT_ZERO_EX_CONTAINER_SELECTOR = '#zeroExInstantContainer';
export const WEB_3_WRAPPER_TRANSACTION_FAILED_ERROR_MSG_PREFIX = 'Transaction failed';
export const GWEI_IN_WEI = new BigNumber(1000000000);
export const DEFAULT_GAS_PRICE = GWEI_IN_WEI.mul(6);
export const DEFAULT_ESTIMATED_TRANSACTION_TIME_MS = 2 * 60 * 1000; // 2 minutes
export const ETH_GAS_STATION_API_BASE_URL = 'https://ethgasstation.info';
export const COINBASE_API_BASE_URL = 'https://api.coinbase.com/v2';
export const PROGRESS_TICK_INTERVAL_MS = 250; // TODO: remove
export const PROGRESS_STALL_AT_PERCENTAGE = 95;
export const PROGRESS_FINISH_ANIMATION_TIME_MS = 200;
