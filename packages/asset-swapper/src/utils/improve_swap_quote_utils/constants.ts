import { BigNumber } from '@0x/utils';

import { ERC20BridgeSource, ImproveOrdersOpts } from './types';

const INFINITE_TIMESTAMP_SEC = new BigNumber(2524604400);

/**
 * Convert a source to a canonical address used by the sampler contract.
 */
const SOURCE_TO_ADDRESS: { [key: string]: string } = {
    [ERC20BridgeSource.Eth2Dai]: '0x39755357759cE0d7f32dC8dC45414CCa409AE24e',
    [ERC20BridgeSource.Uniswap]: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
    [ERC20BridgeSource.Kyber]: '0x818E6FECD516Ecc3849DAf6845e3EC868087B755',
};

/**
 * Valid sources for market sell.
 */
export const SELL_SOURCES = [ERC20BridgeSource.Uniswap, ERC20BridgeSource.Eth2Dai, ERC20BridgeSource.Kyber];

/**
 * Valid sources for market buy.
 */
export const BUY_SOURCES = [ERC20BridgeSource.Uniswap, ERC20BridgeSource.Eth2Dai];

export const DEFAULT_IMPROVE_ORDERS_OPTS: ImproveOrdersOpts = {
    runLimit: 1024,
    excludedSources: [],
    bridgeSlippage: 0.0005,
    dustFractionThreshold: 0.01,
    numSamples: 8,
    noConflicts: false,
};

export const constants = {
    INFINITE_TIMESTAMP_SEC,
    SOURCE_TO_ADDRESS,
    SELL_SOURCES,
    BUY_SOURCES,
    DEFAULT_IMPROVE_ORDERS_OPTS,
};
