import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { AssetBuyerOpts, BuyQuoteExecutionOpts, BuyQuoteRequestOpts, OrdersAndFillableAmounts } from './types';

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAINNET_CHAIN_ID = 1;

const DEFAULT_ASSET_BUYER_OPTS: AssetBuyerOpts = {
    chainId: MAINNET_CHAIN_ID,
    orderRefreshIntervalMs: 10000, // 10 seconds
    expiryBufferSeconds: 120, // 2 minutes
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

const EMPTY_ORDERS_AND_FILLABLE_AMOUNTS: OrdersAndFillableAmounts = {
    orders: [] as SignedOrder[],
    remainingFillableMakerAssetAmounts: [] as BigNumber[],
};

export const constants = {
    ZERO_AMOUNT: new BigNumber(0),
    NULL_ADDRESS,
    MAINNET_CHAIN_ID,
    ETHER_TOKEN_DECIMALS: 18,
    DEFAULT_ASSET_BUYER_OPTS,
    DEFAULT_BUY_QUOTE_EXECUTION_OPTS,
    DEFAULT_BUY_QUOTE_REQUEST_OPTS,
    EMPTY_ORDERS_AND_FILLABLE_AMOUNTS,
};
