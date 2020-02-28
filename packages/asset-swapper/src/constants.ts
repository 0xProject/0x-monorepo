import { BigNumber } from '@0x/utils';

import {
    ExtensionContractType,
    ForwarderExtensionContractOpts,
    OrderPrunerOpts,
    OrderPrunerPermittedFeeTypes,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
    SwapQuoteRequestOpts,
    SwapQuoterOpts,
} from './types';

import { constants as marketOperationUtilConstants } from './utils/market_operation_utils/constants';
import { ERC20BridgeSource } from './utils/market_operation_utils/types';

const ETH_GAS_STATION_API_BASE_URL = 'https://ethgasstation.info';
const NULL_BYTES = '0x';
const NULL_ERC20_ASSET_DATA = '0xf47261b00000000000000000000000000000000000000000000000000000000000000000';
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAINNET_CHAIN_ID = 1;
const ONE_SECOND_MS = 1000;
const DEFAULT_PER_PAGE = 1000;

const DEFAULT_ORDER_PRUNER_OPTS: OrderPrunerOpts = {
    expiryBufferMs: 120000, // 2 minutes
    permittedOrderFeeTypes: new Set<OrderPrunerPermittedFeeTypes>([
        OrderPrunerPermittedFeeTypes.NoFees,
        OrderPrunerPermittedFeeTypes.MakerDenominatedTakerFee,
    ]), // Default asset-swapper for CFL oriented fee types
};

// 15 seconds polling interval
const PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS = 15000;
const PROTOCOL_FEE_MULTIPLIER = new BigNumber(150000);

// default 50% buffer for selecting native orders to be aggregated with other sources
const MARKET_UTILS_AMOUNT_BUFFER_PERCENTAGE = 0.5;

const DEFAULT_SWAP_QUOTER_OPTS: SwapQuoterOpts = {
    ...{
        chainId: MAINNET_CHAIN_ID,
        orderRefreshIntervalMs: 10000, // 10 seconds
    },
    ...DEFAULT_ORDER_PRUNER_OPTS,
    samplerGasLimit: 59e6,
};

const DEFAULT_FORWARDER_EXTENSION_CONTRACT_OPTS: ForwarderExtensionContractOpts = {
    feePercentage: 0,
    feeRecipient: NULL_ADDRESS,
};

const DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS: SwapQuoteGetOutputOpts = {
    useExtensionContract: ExtensionContractType.Forwarder,
    extensionContractOpts: DEFAULT_FORWARDER_EXTENSION_CONTRACT_OPTS,
};

const DEFAULT_FORWARDER_SWAP_QUOTE_EXECUTE_OPTS: SwapQuoteExecutionOpts = DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS;

const DEFAULT_SWAP_QUOTE_REQUEST_OPTS: SwapQuoteRequestOpts = {
    ...{
        slippagePercentage: 0.2, // 20% slippage protection,
    },
    ...marketOperationUtilConstants.DEFAULT_GET_MARKET_ORDERS_OPTS,
};

// Mainnet Curve configuration
const DEFAULT_CURVE_OPTS: { [source: string]: { version: number; curveAddress: string; tokens: string[] } } = {
    [ERC20BridgeSource.CurveUsdcDai]: {
        version: 0,
        curveAddress: '0x2e60cf74d81ac34eb21eeff58db4d385920ef419',
        tokens: ['0x6b175474e89094c44da98b954eedeac495271d0f', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
    },
    [ERC20BridgeSource.CurveUsdcDaiUsdt]: {
        version: 1,
        curveAddress: '0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c',
        tokens: [
            '0x6b175474e89094c44da98b954eedeac495271d0f',
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
        ],
    },
    [ERC20BridgeSource.CurveUsdcDaiUsdtTusd]: {
        version: 1,
        curveAddress: '0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51',
        tokens: [
            '0x6b175474e89094c44da98b954eedeac495271d0f',
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
            '0x0000000000085d4780b73119b644ae5ecd22b376',
        ],
    },
};

export const constants = {
    ETH_GAS_STATION_API_BASE_URL,
    PROTOCOL_FEE_MULTIPLIER,
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
    NULL_ERC20_ASSET_DATA,
    PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS,
    MARKET_UTILS_AMOUNT_BUFFER_PERCENTAGE,
    BRIDGE_ASSET_DATA_PREFIX: '0xdc1600f3',
    DEFAULT_CURVE_OPTS,
};
