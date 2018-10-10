import { BigNumber } from '@0xproject/utils';

import { AssetBuyerOpts, BuyQuoteExecutionOpts, BuyQuoteRequestOpts } from './types';

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAINNET_NETWORK_ID = 1;

const DEFAULT_ASSET_BUYER_OPTS: AssetBuyerOpts = {
    networkId: MAINNET_NETWORK_ID,
    orderRefreshIntervalMs: 10000, // 10 seconds
    expiryBufferSeconds: 300, // 5 minutes
};

const DEFAULT_BUY_QUOTE_REQUEST_OPTS: BuyQuoteRequestOpts = {
    feePercentage: 0,
    shouldForceOrderRefresh: false,
    slippagePercentage: 0.2, // 20% slippage protection
};

// Other default values are dynamically determined
const DEFAULT_BUY_QUOTE_EXECUTION_OPTS: BuyQuoteExecutionOpts = {
    feeRecipient: NULL_ADDRESS,
};

export const constants = {
    ZERO_AMOUNT: new BigNumber(0),
    NULL_ADDRESS,
    MAINNET_NETWORK_ID,
    ETHER_TOKEN_DECIMALS: 18,
    DEFAULT_ASSET_BUYER_OPTS,
    DEFAULT_BUY_QUOTE_EXECUTION_OPTS,
    DEFAULT_BUY_QUOTE_REQUEST_OPTS,
    MAX_PER_PAGE: 10000,
};
