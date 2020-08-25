import { BigNumber } from '@0x/utils';

import { CurveFunctionSelectors, CurveInfo, ERC20BridgeSource, GetMarketOrdersOpts } from './types';

// tslint:disable: custom-no-magic-numbers

/**
 * Valid sources for market sell.
 */
export const SELL_SOURCES = [
    ERC20BridgeSource.Uniswap,
    ERC20BridgeSource.UniswapV2,
    ERC20BridgeSource.Eth2Dai,
    ERC20BridgeSource.Kyber,
    ERC20BridgeSource.Curve,
    ERC20BridgeSource.Balancer,
    // ERC20BridgeSource.Bancor, // FIXME: Disabled until Bancor SDK supports batch requests
    ERC20BridgeSource.MStable,
    ERC20BridgeSource.Mooniswap,
];

/**
 * Valid sources for market buy.
 */
export const BUY_SOURCES = [
    ERC20BridgeSource.Uniswap,
    ERC20BridgeSource.UniswapV2,
    ERC20BridgeSource.Eth2Dai,
    ERC20BridgeSource.Kyber,
    ERC20BridgeSource.Curve,
    ERC20BridgeSource.Balancer,
    // ERC20BridgeSource.Bancor, // FIXME: Disabled until Bancor SDK supports buy quotes
    ERC20BridgeSource.MStable,
    ERC20BridgeSource.Mooniswap,
];

export const DEFAULT_GET_MARKET_ORDERS_OPTS: GetMarketOrdersOpts = {
    // tslint:disable-next-line: custom-no-magic-numbers
    runLimit: 2 ** 15,
    excludedSources: [],
    bridgeSlippage: 0.005,
    maxFallbackSlippage: 0.05,
    numSamples: 13,
    sampleDistributionBase: 1.05,
    feeSchedule: {},
    gasSchedule: {},
    allowFallback: true,
    shouldBatchBridgeOrders: true,
};

/**
 * Sources to poll for ETH fee price estimates.
 */
export const FEE_QUOTE_SOURCES = [ERC20BridgeSource.Uniswap, ERC20BridgeSource.UniswapV2];

/**
 * Mainnet Curve configuration
 */
export const MAINNET_CURVE_INFOS: { [name: string]: CurveInfo } = {
    DaiUsdc: {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.get_dx_underlying,
        poolAddress: '0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56',
        tokens: ['0x6b175474e89094c44da98b954eedeac495271d0f', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
    },
    // DaiUsdcUsdt: {
    //     exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
    //     sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
    //     buyQuoteFunctionSelector: CurveFunctionSelectors.get_dx_underlying,
    //     poolAddress: '0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c',
    //     tokens: [
    //         '0x6b175474e89094c44da98b954eedeac495271d0f',
    //         '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    //         '0xdac17f958d2ee523a2206206994597c13d831ec7',
    //     ],
    // },
    DaiUsdcUsdtTusd: {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.get_dx_underlying,
        poolAddress: '0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51',
        tokens: [
            '0x6b175474e89094c44da98b954eedeac495271d0f',
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
            '0x0000000000085d4780b73119b644ae5ecd22b376',
        ],
    },
    // Looks like it's dying.
    DaiUsdcUsdtBusd: {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.get_dx_underlying,
        poolAddress: '0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27',
        tokens: [
            '0x6b175474e89094c44da98b954eedeac495271d0f',
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
            '0x4fabb145d64652a948d72533023f6e7a623c7c53',
        ],
    },
    DaiUsdcUsdtSusd: {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.get_dx_underlying,
        poolAddress: '0xa5407eae9ba41422680e2e00537571bcc53efbfd',
        tokens: [
            '0x6b175474e89094c44da98b954eedeac495271d0f',
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
            '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
        ],
    },
    RenbtcWbtc: {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        poolAddress: '0x93054188d876f558f4a66b2ef1d97d16edf0895b',
        tokens: ['0xeb4c2781e4eba804ce9a9803c67d0893436bb27d', '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'],
    },
    RenbtcWbtcSbtc: {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        poolAddress: '0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714',
        tokens: [
            '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d',
            '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            '0xfe18be6b3bd88a2d2a7f928d00292e7a9963cfc6',
        ],
    },
};

export const MAINNET_KYBER_INFOS: { [name: string]: string } = {
    Reserve1: '0xff4b796265722046707200000000000000000000000000000000000000000000',
    Reserve2: '0xffabcd0000000000000000000000000000000000000000000000000000000000',
    Reserve3: '0xff4f6e65426974205175616e7400000000000000000000000000000000000000',
};

export const ERC20_PROXY_ID = '0xf47261b0';
export const WALLET_SIGNATURE = '0x04';
export const ONE_ETHER = new BigNumber(1e18);
export const NEGATIVE_INF = new BigNumber('-Infinity');
export const POSITIVE_INF = new BigNumber('Infinity');
export const ZERO_AMOUNT = new BigNumber(0);
export const ONE_HOUR_IN_SECONDS = 60 * 60;
export const ONE_SECOND_MS = 1000;
export const NULL_BYTES = '0x';
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
