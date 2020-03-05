import { BigNumber } from '@0x/utils';

import { ERC20BridgeSource, GetMarketOrdersOpts } from './types';

// tslint:disable: custom-no-magic-numbers

/**
 * Valid sources for market sell.
 */
export const SELL_SOURCES = [
    ERC20BridgeSource.Uniswap,
    ERC20BridgeSource.Eth2Dai,
    ERC20BridgeSource.Kyber,
    // All Curve Sources
    ERC20BridgeSource.CurveUsdcDai,
    ERC20BridgeSource.CurveUsdcDaiUsdt,
    ERC20BridgeSource.CurveUsdcDaiUsdtTusd,
    ERC20BridgeSource.CurveUsdcDaiUsdtBusd,
];

/**
 * Valid sources for market buy.
 */
export const BUY_SOURCES = [ERC20BridgeSource.Uniswap, ERC20BridgeSource.Eth2Dai];

export const DEFAULT_GET_MARKET_ORDERS_OPTS: GetMarketOrdersOpts = {
    // tslint:disable-next-line: custom-no-magic-numbers
    excludedSources: [],
    bridgeSlippage: 0.005,
    numSamples: 20,
    sampleDistributionBase: 1.05,
    fees: {},
    allowFallback: true,
};

/**
 * Sources to poll for ETH fee price estimates.
 */
export const FEE_QUOTE_SOURCES = SELL_SOURCES;

/**
 * Mainnet Curve configuration
 */
export const DEFAULT_CURVE_OPTS: { [source: string]: { version: number; curveAddress: string; tokens: string[] } } = {
    [ERC20BridgeSource.CurveUsdcDai]: {
        version: 1,
        curveAddress: '0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56',
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
    [ERC20BridgeSource.CurveUsdcDaiUsdtBusd]: {
        version: 1,
        curveAddress: '0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27',
        tokens: [
            '0x6b175474e89094c44da98b954eedeac495271d0f',
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
            '0x4fabb145d64652a948d72533023f6e7a623c7c53',
        ],
    },
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
