import { BigNumber } from '@0x/utils';

import {
    ForwarderExtensionContractOpts,
    OrderPrunerOpts,
    OrderPrunerPermittedFeeTypes,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
    SwapQuoteRequestOpts,
    SwapQuoterOpts,
} from './types';

const ETH_GAS_STATION_API_BASE_URL = 'https://ethgasstation.info';
const NULL_BYTES = '0x';
const NULL_ERC20_ASSET_DATA = '0xf47261b00000000000000000000000000000000000000000000000000000000000000000';
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAINNET_CHAIN_ID = 1;
const ONE_SECOND_MS = 1000;
const DEFAULT_PER_PAGE = 1000;
const PROTOCOL_FEE_MULTIPLIER = 150000;

const DEFAULT_ORDER_PRUNER_OPTS: OrderPrunerOpts = {
    expiryBufferMs: 120000, // 2 minutes
    permittedOrderFeeTypes: new Set<OrderPrunerPermittedFeeTypes>([
        OrderPrunerPermittedFeeTypes.NoFees,
        OrderPrunerPermittedFeeTypes.MakerDenominatedTakerFee,
    ]), // Default asset-swapper for CFL oriented fee types
};

const DEFAULT_SWAP_QUOTER_OPTS: SwapQuoterOpts = {
    ...{
        chainId: MAINNET_CHAIN_ID,
        orderRefreshIntervalMs: 10000, // 10 seconds
    },
    ...DEFAULT_ORDER_PRUNER_OPTS,
};

const DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS: SwapQuoteGetOutputOpts & ForwarderExtensionContractOpts = {
    feePercentage: 0,
    feeRecipient: NULL_ADDRESS,
};

const DEFAULT_FORWARDER_SWAP_QUOTE_EXECUTE_OPTS: SwapQuoteExecutionOpts &
    ForwarderExtensionContractOpts = DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS;

const DEFAULT_SWAP_QUOTE_REQUEST_OPTS: SwapQuoteRequestOpts = {
    slippagePercentage: 0.2, // 20% slippage protection,
};

export const constants = {
    ETH_GAS_STATION_API_BASE_URL,
    NULL_BYTES,
    ZERO_AMOUNT: new BigNumber(0),
    NULL_ADDRESS,
    MAINNET_CHAIN_ID,
    DEFAULT_ORDER_PRUNER_OPTS,
    ETHER_TOKEN_DECIMALS: 18,
    ONE_AMOUNT: new BigNumber(1),
    ONE_SECOND_MS,
    DEFAULT_SWAP_QUOTER_OPTS,
    DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS,
    DEFAULT_FORWARDER_SWAP_QUOTE_EXECUTE_OPTS,
    DEFAULT_SWAP_QUOTE_REQUEST_OPTS,
    DEFAULT_PER_PAGE,
    PROTOCOL_FEE_MULTIPLIER,
    NULL_ERC20_ASSET_DATA,
};
