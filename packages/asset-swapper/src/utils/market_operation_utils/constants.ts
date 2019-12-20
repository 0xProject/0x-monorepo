import { BigNumber } from '@0x/utils';

import { ERC20BridgeSource, GetMarketOrdersOpts } from './types';

const INFINITE_TIMESTAMP_SEC = new BigNumber(2524604400);

/**
 * Convert a source to a canonical address used by the sampler contract.
 */
const SOURCE_TO_ADDRESS: { [key: string]: string } = {
    [ERC20BridgeSource.Eth2Dai]: '0x39755357759ce0d7f32dc8dc45414cca409ae24e',
    [ERC20BridgeSource.Uniswap]: '0xc0a47dfe034b400b47bdad5fecda2621de6c4d95',
    [ERC20BridgeSource.Kyber]: '0x818e6fecd516ecc3849daf6845e3ec868087b755',
};

/**
 * Valid sources for market sell.
 */
export const SELL_SOURCES = [ERC20BridgeSource.Uniswap, ERC20BridgeSource.Eth2Dai, ERC20BridgeSource.Kyber];

/**
 * Valid sources for market buy.
 */
export const BUY_SOURCES = [ERC20BridgeSource.Uniswap, ERC20BridgeSource.Eth2Dai];

export const DEFAULT_GET_MARKET_ORDERS_OPTS: GetMarketOrdersOpts = {
    runLimit: 4096,
    excludedSources: [],
    bridgeSlippage: 0.0005,
    dustFractionThreshold: 0.01,
    numSamples: 10,
    noConflicts: true,
    minUniswapDecimals: 7,
};

export const constants = {
    INFINITE_TIMESTAMP_SEC,
    SOURCE_TO_ADDRESS,
    SELL_SOURCES,
    BUY_SOURCES,
    DEFAULT_GET_MARKET_ORDERS_OPTS,
    ERC20_PROXY_ID: '0xf47261b0',
    WALLET_SIGNATURE: '0x04',
    SAMPLER_CONTRACT_GAS_LIMIT: 10e6,
};
