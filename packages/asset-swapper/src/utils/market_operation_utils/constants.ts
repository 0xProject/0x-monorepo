import { BigNumber } from '@0x/utils';

import { ERC20BridgeSource, GetMarketOrdersOpts } from './types';

const INFINITE_TIMESTAMP_SEC = new BigNumber(2524604400);

/**
 * Valid sources for market sell.
 */
export const SELL_SOURCES = [ERC20BridgeSource.Uniswap, ERC20BridgeSource.Eth2Dai, ERC20BridgeSource.Kyber];

/**
 * Valid sources for market buy.
 */
export const BUY_SOURCES = [ERC20BridgeSource.Uniswap, ERC20BridgeSource.Eth2Dai];

export const DEFAULT_GET_MARKET_ORDERS_OPTS: GetMarketOrdersOpts = {
    // tslint:disable-next-line: custom-no-magic-numbers
    runLimit: 2 ** 15,
    excludedSources: [],
    bridgeSlippage: 0.0005,
    dustFractionThreshold: 0.0025,
    numSamples: 13,
    noConflicts: true,
    sampleDistributionBase: 1.05,
};

export const constants = {
    INFINITE_TIMESTAMP_SEC,
    SELL_SOURCES,
    BUY_SOURCES,
    DEFAULT_GET_MARKET_ORDERS_OPTS,
    ERC20_PROXY_ID: '0xf47261b0',
    WALLET_SIGNATURE: '0x04',
};
