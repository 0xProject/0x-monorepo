import { ChainId } from '@0x/contract-addresses';
import { BigNumber, logUtils } from '@0x/utils';

import {
    BridgeContractAddresses,
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
import {
    CurveFillData,
    DODOFillData,
    ERC20BridgeSource,
    FeeSchedule,
    FillData,
    MultiHopFillData,
    SushiSwapFillData,
    UniswapV2FillData,
} from './utils/market_operation_utils/types';

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
    chainId: ChainId.Mainnet,
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

const EMPTY_BRIDGE_ADDRESSES: BridgeContractAddresses = {
    uniswapBridge: NULL_ADDRESS,
    uniswapV2Bridge: NULL_ADDRESS,
    eth2DaiBridge: NULL_ADDRESS,
    kyberBridge: NULL_ADDRESS,
    curveBridge: NULL_ADDRESS,
    multiBridge: NULL_ADDRESS,
    balancerBridge: NULL_ADDRESS,
    bancorBridge: NULL_ADDRESS,
    mStableBridge: NULL_ADDRESS,
    mooniswapBridge: NULL_ADDRESS,
    sushiswapBridge: NULL_ADDRESS,
    shellBridge: NULL_ADDRESS,
    dodoBridge: NULL_ADDRESS,
    creamBridge: NULL_ADDRESS,
};

export const BRIDGE_ADDRESSES_BY_CHAIN: { [chainId in ChainId]: BridgeContractAddresses } = {
    [ChainId.Mainnet]: {
        uniswapBridge: '0x36691c4f426eb8f42f150ebde43069a31cb080ad',
        uniswapV2Bridge: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
        kyberBridge: '0xadd97271402590564ddd8ad23cb5317b1fb0fffb',
        eth2DaiBridge: '0x991c745401d5b5e469b8c3e2cb02c748f08754f1',
        curveBridge: '0x1796cd592d19e3bcd744fbb025bb61a6d8cb2c09',
        multiBridge: '0xc03117a8c9bde203f70aa911cb64a7a0df5ba1e1',
        balancerBridge: '0xfe01821ca163844203220cd08e4f2b2fb43ae4e4',
        bancorBridge: '0x259897d9699553edbdf8538599242354e957fb94',
        mStableBridge: '0x2bf04fcea05f0989a14d9afa37aa376baca6b2b3',
        mooniswapBridge: '0x02b7eca484ad960fca3f7709e0b2ac81eec3069c',
        sushiswapBridge: '0x47ed0262a0b688dcb836d254c6a2e96b6c48a9f5',
        shellBridge: '0x21fb3862eed7911e0f8219a077247b849846728d',
        dodoBridge: '0xe9da66965a9344aab2167e6813c03f043cc7a6ca',
        creamBridge: '0xb9d4bf2c8dab828f4ffb656acdb6c2b497d44f25',
    },
    [ChainId.Kovan]: {
        ...EMPTY_BRIDGE_ADDRESSES,
        uniswapBridge: '0x0e85f89f29998df65402391478e5924700c0079d',
        uniswapV2Bridge: '0x7b3530a635d099de0534dc27e46cd7c57578c3c8',
        eth2DaiBridge: '0x2d47147429b474d2e4f83e658015858a1312ed5b',
        kyberBridge: '0xaecfa25920f892b6eb496e1f6e84037f59da7f44',
        curveBridge: '0x81c0ab53a7352d2e97f682a37cba44e54647eefb',
        balancerBridge: '0x407b4128e9ecad8769b2332312a9f655cb9f5f3a',
    },
    [ChainId.Rinkeby]: EMPTY_BRIDGE_ADDRESSES,
    [ChainId.Ropsten]: EMPTY_BRIDGE_ADDRESSES,
    [ChainId.Ganache]: EMPTY_BRIDGE_ADDRESSES,
};

// tslint:disable:custom-no-magic-numbers
export const DEFAULT_GAS_SCHEDULE: FeeSchedule = {
    [ERC20BridgeSource.Native]: () => 150e3,
    [ERC20BridgeSource.Uniswap]: () => 90e3,
    [ERC20BridgeSource.LiquidityProvider]: () => 140e3,
    [ERC20BridgeSource.Eth2Dai]: () => 400e3,
    [ERC20BridgeSource.Kyber]: () => 500e3,
    [ERC20BridgeSource.Curve]: fillData => {
        switch ((fillData as CurveFillData).curve.poolAddress.toLowerCase()) {
            case '0xa5407eae9ba41422680e2e00537571bcc53efbfd':
            case '0x93054188d876f558f4a66b2ef1d97d16edf0895b':
            case '0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714':
            case '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7':
                return 150e3;
            case '0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56':
                return 750e3;
            case '0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51':
                return 850e3;
            case '0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27':
                return 1e6;
            case '0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c':
                return 600e3;
            default:
                throw new Error('Unrecognized Curve address');
        }
    },
    [ERC20BridgeSource.MultiBridge]: () => 350e3,
    [ERC20BridgeSource.UniswapV2]: (fillData?: FillData) => {
        // TODO: Different base cost if to/from ETH.
        let gas = 90e3;
        const path = (fillData as UniswapV2FillData).tokenAddressPath;
        if (path.length > 2) {
            gas += (path.length - 2) * 60e3; // +60k for each hop.
        }
        return gas;
    },
    [ERC20BridgeSource.SushiSwap]: (fillData?: FillData) => {
        // TODO: Different base cost if to/from ETH.
        let gas = 95e3;
        const path = (fillData as SushiSwapFillData).tokenAddressPath;
        if (path.length > 2) {
            gas += (path.length - 2) * 60e3; // +60k for each hop.
        }
        return gas;
    },
    [ERC20BridgeSource.Balancer]: () => 120e3,
    [ERC20BridgeSource.Cream]: () => 300e3,
    [ERC20BridgeSource.MStable]: () => 700e3,
    [ERC20BridgeSource.Mooniswap]: () => 220e3,
    [ERC20BridgeSource.Swerve]: () => 150e3,
    [ERC20BridgeSource.Shell]: () => 300e3,
    [ERC20BridgeSource.MultiHop]: (fillData?: FillData) => {
        const firstHop = (fillData as MultiHopFillData).firstHopSource;
        const secondHop = (fillData as MultiHopFillData).secondHopSource;
        const firstHopGas = DEFAULT_GAS_SCHEDULE[firstHop.source]!(firstHop.fillData);
        const secondHopGas = DEFAULT_GAS_SCHEDULE[secondHop.source]!(secondHop.fillData);
        return new BigNumber(firstHopGas)
            .plus(secondHopGas)
            .plus(30e3)
            .toNumber();
    },
    [ERC20BridgeSource.Dodo]: (fillData?: FillData) => {
        const isSellBase = (fillData as DODOFillData).isSellBase;
        // Sell base is cheaper as it is natively supported
        // sell quote requires additional calculation and overhead
        return isSellBase ? 440e3 : 540e3;
    },
};
// tslint:enable:custom-no-magic-numbers

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
    BRIDGE_ADDRESSES_BY_CHAIN,
    DEFAULT_GAS_SCHEDULE,
};
