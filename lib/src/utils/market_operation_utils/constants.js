"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
var types_1 = require("./types");
var INFINITE_TIMESTAMP_SEC = new utils_1.BigNumber(2524604400);
/**
 * Valid sources for market sell.
 */
exports.SELL_SOURCES = [
    types_1.ERC20BridgeSource.Uniswap,
    types_1.ERC20BridgeSource.Eth2Dai,
    types_1.ERC20BridgeSource.Kyber,
    types_1.ERC20BridgeSource.CurveUsdcDai,
    types_1.ERC20BridgeSource.CurveUsdcDaiUsdt,
    types_1.ERC20BridgeSource.CurveUsdcDaiUsdtTusd,
];
/**
 * Valid sources for market buy.
 */
exports.BUY_SOURCES = [types_1.ERC20BridgeSource.Uniswap, types_1.ERC20BridgeSource.Eth2Dai];
exports.DEFAULT_GET_MARKET_ORDERS_OPTS = {
    // tslint:disable-next-line: custom-no-magic-numbers
    runLimit: Math.pow(2, 15),
    excludedSources: [],
    bridgeSlippage: 0.0005,
    dustFractionThreshold: 0.0025,
    numSamples: 13,
    noConflicts: true,
    sampleDistributionBase: 1.05,
    fees: {},
};
/**
 * Sources to poll for ETH fee price estimates.
 */
exports.FEE_QUOTE_SOURCES = exports.SELL_SOURCES;
exports.constants = {
    INFINITE_TIMESTAMP_SEC: INFINITE_TIMESTAMP_SEC,
    SELL_SOURCES: exports.SELL_SOURCES,
    BUY_SOURCES: exports.BUY_SOURCES,
    DEFAULT_GET_MARKET_ORDERS_OPTS: exports.DEFAULT_GET_MARKET_ORDERS_OPTS,
    ERC20_PROXY_ID: '0xf47261b0',
    FEE_QUOTE_SOURCES: exports.FEE_QUOTE_SOURCES,
    WALLET_SIGNATURE: '0x04',
    ONE_ETHER: new utils_1.BigNumber(1e18),
};
//# sourceMappingURL=constants.js.map