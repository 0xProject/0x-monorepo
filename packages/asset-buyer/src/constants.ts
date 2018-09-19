import { BigNumber } from '@0xproject/utils';

import { BuyQuoteRequestOpts } from './types';

const DEFAULT_BUY_QUOTE_REQUEST_OPTS: BuyQuoteRequestOpts = {
    feePercentage: 0,
    shouldForceOrderRefresh: false,
    slippagePercentage: 0.2, // 20% slippage protection
};

export const constants = {
    ZERO_AMOUNT: new BigNumber(0),
    NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
    MAINNET_NETWORK_ID: 1,
    DEFAULT_ORDER_REFRESH_INTERVAL_MS: 10000, // 10 seconds
    ETHER_TOKEN_DECIMALS: 18,
    DEFAULT_BUY_QUOTE_REQUEST_OPTS,
};
