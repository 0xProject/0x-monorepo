import { BigNumber } from '@0x/utils';

import { SourceFilters } from './source_filters';
import { CurveFunctionSelectors, CurveInfo, ERC20BridgeSource, GetMarketOrdersOpts } from './types';

// tslint:disable: custom-no-magic-numbers no-bitwise

/**
 * Valid sources for market sell.
 */
export const SELL_SOURCE_FILTER = new SourceFilters([
    ERC20BridgeSource.Native,
    ERC20BridgeSource.Uniswap,
    ERC20BridgeSource.UniswapV2,
    ERC20BridgeSource.Eth2Dai,
    ERC20BridgeSource.Kyber,
    ERC20BridgeSource.Curve,
    ERC20BridgeSource.Balancer,
    // Bancor is sampled off-chain, but this list should only include on-chain sources (used in ERC20BridgeSampler)
    // ERC20BridgeSource.Bancor,
    ERC20BridgeSource.MStable,
    ERC20BridgeSource.Mooniswap,
    ERC20BridgeSource.Swerve,
    ERC20BridgeSource.SnowSwap,
    ERC20BridgeSource.SushiSwap,
    ERC20BridgeSource.Shell,
    ERC20BridgeSource.MultiHop,
    ERC20BridgeSource.Dodo,
    ERC20BridgeSource.Cream,
    ERC20BridgeSource.Plasmaswap,
]);

/**
 * Valid sources for market buy.
 */
export const BUY_SOURCE_FILTER = new SourceFilters(
    [
        ERC20BridgeSource.Native,
        ERC20BridgeSource.Uniswap,
        ERC20BridgeSource.UniswapV2,
        ERC20BridgeSource.Eth2Dai,
        ERC20BridgeSource.Kyber,
        ERC20BridgeSource.Curve,
        ERC20BridgeSource.Balancer,
        // ERC20BridgeSource.Bancor, // FIXME: Disabled until Bancor SDK supports buy quotes
        ERC20BridgeSource.MStable,
        ERC20BridgeSource.Mooniswap,
        ERC20BridgeSource.Shell,
        ERC20BridgeSource.Swerve,
        ERC20BridgeSource.SnowSwap,
        ERC20BridgeSource.SushiSwap,
        ERC20BridgeSource.MultiHop,
        ERC20BridgeSource.Dodo,
        ERC20BridgeSource.Cream,
        ERC20BridgeSource.Plasmaswap,
    ],
    [ERC20BridgeSource.MultiBridge],
);

export const DEFAULT_GET_MARKET_ORDERS_OPTS: GetMarketOrdersOpts = {
    // tslint:disable-next-line: custom-no-magic-numbers
    runLimit: 2 ** 15,
    excludedSources: [],
    excludedFeeSources: [],
    includedSources: [],
    bridgeSlippage: 0.005,
    maxFallbackSlippage: 0.05,
    numSamples: 13,
    sampleDistributionBase: 1.05,
    feeSchedule: {},
    gasSchedule: {},
    exchangeProxyOverhead: () => ZERO_AMOUNT,
    allowFallback: true,
    shouldGenerateQuoteReport: false,
};

/**
 * Sources to poll for ETH fee price estimates.
 */
export const FEE_QUOTE_SOURCES = [ERC20BridgeSource.Uniswap, ERC20BridgeSource.UniswapV2];

export const SOURCE_FLAGS: { [source in ERC20BridgeSource]: number } = Object.assign(
    {},
    ...Object.values(ERC20BridgeSource).map((source: ERC20BridgeSource, index) => ({ [source]: 1 << index })),
);

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
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
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
    TriPool: {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        poolAddress: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
        tokens: [
            '0x6b175474e89094c44da98b954eedeac495271d0f',
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
        ],
    },
};
export const MAINNET_SWERVE_INFOS: { [name: string]: CurveInfo } = {
    swUSD: {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        poolAddress: '0x329239599afb305da0a2ec69c58f8a6697f9f88d', // _target: 0xa5407eae9ba41422680e2e00537571bcc53efbfd
        tokens: [
            '0x6b175474e89094c44da98b954eedeac495271d0f',
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
            '0x0000000000085d4780b73119b644ae5ecd22b376',
        ],
    },
};
export const MAINNET_SNOWSWAP_INFOS: { [name: string]: CurveInfo } = {
    yVaultCurve: {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.get_dx,
        poolAddress: '0xbf7ccd6c446acfcc5df023043f2167b62e81899b',
        tokens: [
            '0x5dbcf33d8c2e976c6b560249878e6f1491bca25c', // yUSD
            '0x2994529c0652d127b7842094103715ec5299bbed', // ybCRV
        ],
    },
    yVaultCurveUnderlying: {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.get_dx_underlying,
        poolAddress: '0xbf7ccd6c446acfcc5df023043f2167b62e81899b',
        tokens: [
            '0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8', // yCRV
            '0x3b3ac5386837dc563660fb6a0937dfaa5924333b', // bCRV
        ],
    },
    yVaultUSD: {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.get_dx,
        poolAddress: '0x4571753311e37ddb44faa8fb78a6df9a6e3c6c0b',
        tokens: [
            '0xacd43e627e64355f1861cec6d3a6688b31a6f952', // yDAI
            '0x597ad1e0c13bfe8025993d9e79c69e1c0233522e', // yUSDC
            '0x2f08119c6f07c006695e079aafc638b8789faf18', // yUSDT
            '0x37d19d1c4e1fa9dc47bd1ea12f742a0887eda74a', // yTUSD
        ],
    },
    // Gas is too high for these underlying tokens (3M+)
    // yVaultUSDUnderlying: {
    //     exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
    //     sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
    //     buyQuoteFunctionSelector: CurveFunctionSelectors.get_dx_underlying,
    //     poolAddress: '0x4571753311e37ddb44faa8fb78a6df9a6e3c6c0b',
    //     tokens: [
    //        '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
    //        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    //        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    //        '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
    //     ],
    // },
};

export const MAINNET_KYBER_RESERVE_IDS: { [name: string]: string } = {
    Reserve1: '0xff4b796265722046707200000000000000000000000000000000000000000000',
    Reserve2: '0xffabcd0000000000000000000000000000000000000000000000000000000000',
    Reserve3: '0xff4f6e65426974205175616e7400000000000000000000000000000000000000',
};

export const MAINNET_KYBER_TOKEN_RESERVE_IDS: { [token: string]: string } = {
    // USDC
    ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48']:
        '0xaa55534443303041505200000000000000000000000000000000000000000000',
    // AMPL
    ['0xd46ba6d942050d489dbd938a2c909a5d5039a161']:
        '0xaad46ba6d942050d489dbd938a2c909a5d5039a1610000000000000000000000',
    // UBT
    ['0x8400d94a5cb0fa0d041a3788e395285d61c9ee5e']:
        '0xaa55425400000000000000000000000000000000000000000000000000000000',
    // ANT
    ['0x960b236a07cf122663c4303350609a66a7b288c0']:
        '0xaa414e5400000000000000000000000000000000000000000000000000000000',
    // KNC
    ['0xdd974d5c2e2928dea5f71b9825b8b646686bd200']:
        '0xaa4b4e435f4d4547414c41444f4e000000000000000000000000000000000000',
    // sUSD
    ['0x57ab1ec28d129707052df4df418d58a2d46d5f51']:
        '0xaa73555344000000000000000000000000000000000000000000000000000000',
    // SNX
    ['0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f']:
        '0xaa534e5800000000000000000000000000000000000000000000000000000000',
    // REN
    ['0x408e41876cccdc0f92210600ef50372656052a38']:
        '0xaa72656e00000000000000000000000000000000000000000000000000000000',
    // BAND
    ['0xba11d00c5f74255f56a5e366f4f77f5a186d7f55']:
        '0xaa42414e44000000000000000000000000000000000000000000000000000000',
};

export const MAINNET_SUSHI_SWAP_ROUTER = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F';

export const MAINNET_PLASMA_SWAP_ROUTER = '0x0000000000000000000000000000000000000000';

export const ERC20_PROXY_ID = '0xf47261b0';
export const WALLET_SIGNATURE = '0x04';
export const ONE_ETHER = new BigNumber(1e18);
export const NEGATIVE_INF = new BigNumber('-Infinity');
export const POSITIVE_INF = new BigNumber('Infinity');
export const ZERO_AMOUNT = new BigNumber(0);
export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);
export const ONE_HOUR_IN_SECONDS = 60 * 60;
export const ONE_SECOND_MS = 1000;
export const NULL_BYTES = '0x';
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
export const COMPARISON_PRICE_DECIMALS = 5;
