import { BigNumber, logUtils } from '@0x/utils';

import {
    ExchangeProxyContractOpts,
    ExtensionContractType,
    ForwarderExtensionContractOpts,
    LogFunction,
    OrderPrunerOpts,
    OrderPrunerPermittedFeeTypes,
    RfqtRequestOpts,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
    SwapQuoteRequestOpts,
    SwapQuoterOpts,
} from './types';
import { DEFAULT_GET_MARKET_ORDERS_OPTS } from './utils/market_operation_utils/constants';

const ETH_GAS_STATION_API_URL = 'https://ethgasstation.info/api/ethgasAPI.json';
const NULL_BYTES = '0x';
const NULL_ERC20_ASSET_DATA = '0xf47261b00000000000000000000000000000000000000000000000000000000000000000';
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAINNET_CHAIN_ID = 1;
const ONE_SECOND_MS = 1000;
const ONE_MINUTE_SECS = 60;
const ONE_MINUTE_MS = ONE_SECOND_MS * ONE_MINUTE_SECS;
const DEFAULT_PER_PAGE = 1000;
const ZERO_AMOUNT = new BigNumber(0);

const DEFAULT_ORDER_PRUNER_OPTS: OrderPrunerOpts = {
    expiryBufferMs: 120000, // 2 minutes
    permittedOrderFeeTypes: new Set<OrderPrunerPermittedFeeTypes>([
        OrderPrunerPermittedFeeTypes.NoFees,
        OrderPrunerPermittedFeeTypes.MakerDenominatedTakerFee,
    ]), // Default asset-swapper for CFL oriented fee types
};

// 6 seconds polling interval
const PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS = 6000;
const PROTOCOL_FEE_MULTIPLIER = new BigNumber(70000);

// default 50% buffer for selecting native orders to be aggregated with other sources
const MARKET_UTILS_AMOUNT_BUFFER_PERCENTAGE = 0.5;

const DEFAULT_SWAP_QUOTER_OPTS: SwapQuoterOpts = {
    chainId: MAINNET_CHAIN_ID,
    orderRefreshIntervalMs: 10000, // 10 seconds
    ...DEFAULT_ORDER_PRUNER_OPTS,
    samplerGasLimit: 250e6,
    ethGasStationUrl: ETH_GAS_STATION_API_URL,
    rfqt: {
        takerApiKeyWhitelist: [],
        makerAssetOfferings: {},
    },
};

const DEFAULT_FORWARDER_EXTENSION_CONTRACT_OPTS: ForwarderExtensionContractOpts = {
    feePercentage: 0,
    feeRecipient: NULL_ADDRESS,
};

const DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS: SwapQuoteGetOutputOpts = {
    useExtensionContract: ExtensionContractType.Forwarder,
    extensionContractOpts: DEFAULT_FORWARDER_EXTENSION_CONTRACT_OPTS,
};

const DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS: ExchangeProxyContractOpts = {
    isFromETH: false,
    isToETH: false,
    affiliateFee: {
        recipient: NULL_ADDRESS,
        buyTokenFeeAmount: ZERO_AMOUNT,
        sellTokenFeeAmount: ZERO_AMOUNT,
    },
    refundReceiver: NULL_ADDRESS,
    isMetaTransaction: false,
};

const DEFAULT_FORWARDER_SWAP_QUOTE_EXECUTE_OPTS: SwapQuoteExecutionOpts = DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS;

const DEFAULT_EXCHANGE_PROXY_SWAP_QUOTE_GET_OPTS: SwapQuoteGetOutputOpts = {
    useExtensionContract: ExtensionContractType.ExchangeProxy,
    extensionContractOpts: DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS,
};

const DEFAULT_SWAP_QUOTE_REQUEST_OPTS: SwapQuoteRequestOpts = {
    ...DEFAULT_GET_MARKET_ORDERS_OPTS,
};

const DEFAULT_RFQT_REQUEST_OPTS: Partial<RfqtRequestOpts> = {
    makerEndpointMaxResponseTimeMs: 1000,
};

export const DEFAULT_INFO_LOGGER: LogFunction = (obj, msg) =>
    logUtils.log(`${msg ? `${msg}: ` : ''}${JSON.stringify(obj)}`);
export const DEFAULT_WARNING_LOGGER: LogFunction = (obj, msg) =>
    logUtils.warn(`${msg ? `${msg}: ` : ''}${JSON.stringify(obj)}`);

export const constants = {
    ETH_GAS_STATION_API_URL,
    PROTOCOL_FEE_MULTIPLIER,
    NULL_BYTES,
    ZERO_AMOUNT,
    NULL_ADDRESS,
    MAINNET_CHAIN_ID,
    DEFAULT_ORDER_PRUNER_OPTS,
    ETHER_TOKEN_DECIMALS: 18,
    ONE_AMOUNT: new BigNumber(1),
    ONE_SECOND_MS,
    ONE_MINUTE_MS,
    DEFAULT_SWAP_QUOTER_OPTS,
    DEFAULT_FORWARDER_SWAP_QUOTE_GET_OPTS,
    DEFAULT_FORWARDER_SWAP_QUOTE_EXECUTE_OPTS,
    DEFAULT_SWAP_QUOTE_REQUEST_OPTS,
    DEFAULT_EXCHANGE_PROXY_SWAP_QUOTE_GET_OPTS,
    DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS,
    DEFAULT_PER_PAGE,
    DEFAULT_RFQT_REQUEST_OPTS,
    NULL_ERC20_ASSET_DATA,
    PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS,
    MARKET_UTILS_AMOUNT_BUFFER_PERCENTAGE,
    BRIDGE_ASSET_DATA_PREFIX: '0xdc1600f3',
    DEFAULT_INFO_LOGGER,
    DEFAULT_WARNING_LOGGER,
};

// This feature flag allows us to merge the price-aware RFQ pricing
// project while still controlling when to activate the feature. We plan to do some
// data analysis work and address some of the issues with maker fillable amounts
// in later milestones. Once the feature is fully rolled out and is providing value
// and we have assessed that there is no user impact, we will proceed in cleaning up
// the feature flag.  When that time comes, follow this PR to "undo" the feature flag:
// https://github.com/0xProject/0x-monorepo/pull/2735
export const IS_PRICE_AWARE_RFQ_ENABLED: boolean = false;
