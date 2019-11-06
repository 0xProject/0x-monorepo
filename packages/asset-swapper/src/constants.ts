import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import {
    ForwarderSwapQuoteExecutionOpts,
    ForwarderSwapQuoteGetOutputOpts,
    OrdersAndFillableAmounts,
    SwapQuoteRequestOpts,
    SwapQuoterOpts,
} from './types';

const NULL_BYTES = '0x';
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAINNET_CHAIN_ID = 1;
const ONE_SECOND_MS = 1000;
const DEFAULT_PER_PAGE = 1000;

const DEFAULT_SWAP_QUOTER_OPTS: SwapQuoterOpts = {
    chainId: MAINNET_CHAIN_ID,
    orderRefreshIntervalMs: 10000, // 10 seconds
    expiryBufferMs: 120000, // 2 minutes
};

const DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS: ForwarderSwapQuoteGetOutputOpts = {
    feePercentage: 0,
    feeRecipient: NULL_ADDRESS,
};

const DEFAULT_FORWARDER_SWAP_QUOTE_EXECUTE_OPTS: ForwarderSwapQuoteExecutionOpts = DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS;

const DEFAULT_SWAP_QUOTE_REQUEST_OPTS: SwapQuoteRequestOpts = {
    shouldDisableRequestingFeeOrders: false,
    slippagePercentage: 0.2, // 20% slippage protection,
};

const EMPTY_ORDERS_AND_FILLABLE_AMOUNTS: OrdersAndFillableAmounts = {
    orders: [] as SignedOrder[],
    remainingFillableMakerAssetAmounts: [] as BigNumber[],
};

export const constants = {
    NULL_BYTES,
    ZERO_AMOUNT: new BigNumber(0),
    NULL_ADDRESS,
    MAINNET_CHAIN_ID,
    ETHER_TOKEN_DECIMALS: 18,
    ONE_AMOUNT: new BigNumber(1),
    ONE_SECOND_MS,
    DEFAULT_SWAP_QUOTER_OPTS,
    DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS,
    DEFAULT_FORWARDER_SWAP_QUOTE_EXECUTE_OPTS,
    DEFAULT_SWAP_QUOTE_REQUEST_OPTS,
    EMPTY_ORDERS_AND_FILLABLE_AMOUNTS,
    DEFAULT_PER_PAGE,
};
