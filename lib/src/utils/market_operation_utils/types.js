"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Common exception messages thrown by aggregation logic.
 */
var AggregationError;
(function (AggregationError) {
    AggregationError["NoOptimalPath"] = "NO_OPTIMAL_PATH";
    AggregationError["EmptyOrders"] = "EMPTY_ORDERS";
    AggregationError["NotERC20AssetData"] = "NOT_ERC20ASSET_DATA";
    AggregationError["NoBridgeForSource"] = "NO_BRIDGE_FOR_SOURCE";
})(AggregationError = exports.AggregationError || (exports.AggregationError = {}));
/**
 * DEX sources to aggregate.
 */
var ERC20BridgeSource;
(function (ERC20BridgeSource) {
    ERC20BridgeSource["Native"] = "Native";
    ERC20BridgeSource["Uniswap"] = "Uniswap";
    ERC20BridgeSource["Eth2Dai"] = "Eth2Dai";
    ERC20BridgeSource["Kyber"] = "Kyber";
    ERC20BridgeSource["CurveUsdcDai"] = "Curve_USDC_DAI";
    ERC20BridgeSource["CurveUsdcDaiUsdt"] = "Curve_USDC_DAI_USDT";
    ERC20BridgeSource["CurveUsdcDaiUsdtTusd"] = "Curve_USDC_DAI_USDT_TUSD";
})(ERC20BridgeSource = exports.ERC20BridgeSource || (exports.ERC20BridgeSource = {}));
/**
 * Flags for `Fill` objects.
 */
var FillFlags;
(function (FillFlags) {
    FillFlags[FillFlags["SourceNative"] = 1] = "SourceNative";
    FillFlags[FillFlags["SourceUniswap"] = 2] = "SourceUniswap";
    FillFlags[FillFlags["SourceEth2Dai"] = 4] = "SourceEth2Dai";
    FillFlags[FillFlags["SourceKyber"] = 8] = "SourceKyber";
})(FillFlags = exports.FillFlags || (exports.FillFlags = {}));
//# sourceMappingURL=types.js.map