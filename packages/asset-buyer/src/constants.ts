import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { AssetSwapQuoterOpts, ForwarderSwapQuoteExecutionOpts, OrdersAndFillableAmounts, SwapQuoteRequestOpts, SwapQuoteExecutionOpts } from './types';

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAINNET_NETWORK_ID = 1;

const DEFAULT_ASSET_SWAP_QUOTER_OPTS: AssetSwapQuoterOpts = {
    networkId: MAINNET_NETWORK_ID,
    orderRefreshIntervalMs: 10000, // 10 seconds
    expiryBufferSeconds: 120, // 2 minutes
};

const DEFAULT_SWAP_QUOTE_REQUEST_OPTS: SwapQuoteRequestOpts = {
    shouldForceOrderRefresh: false,
    slippagePercentage: 0.2, // 20% slippage protection,
    allowMarketBuyOrders: true,
};

const EMPTY_ORDERS_AND_FILLABLE_AMOUNTS: OrdersAndFillableAmounts = {
    orders: [] as SignedOrder[],
    remainingFillableMakerAssetAmounts: [] as BigNumber[],
};
 
export const constants = {
    ZERO_AMOUNT: new BigNumber(0),
    NULL_ADDRESS,
    MAINNET_NETWORK_ID,
    ETHER_TOKEN_DECIMALS: 18,
    ONE_AMOUNT: new BigNumber(1),
    DEFAULT_ASSET_SWAP_QUOTER_OPTS,
    DEFAULT_SWAP_QUOTE_REQUEST_OPTS,
    EMPTY_ORDERS_AND_FILLABLE_AMOUNTS,
};
