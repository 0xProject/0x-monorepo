import { ERC20BridgeSource, BigNumber, SwapQuoteRequestOpts } from '@0x/asset-swapper';

// Params to emulate 0x API params
const gasSchedule: { [key in ERC20BridgeSource]: number } = {
    [ERC20BridgeSource.Native]: 1.5e5,
    [ERC20BridgeSource.Uniswap]: 3e5,
    [ERC20BridgeSource.LiquidityProvider]: 3e5,
    [ERC20BridgeSource.Eth2Dai]: 5.5e5,
    [ERC20BridgeSource.Kyber]: 8e5,
    [ERC20BridgeSource.CurveUsdcDai]: 9e5,
    [ERC20BridgeSource.CurveUsdcDaiUsdt]: 9e5,
    [ERC20BridgeSource.CurveUsdcDaiUsdtTusd]: 10e5,
    [ERC20BridgeSource.CurveUsdcDaiUsdtBusd]: 10e5,
};
const feeSchedule: { [key in ERC20BridgeSource]: BigNumber } = Object.assign(
    {},
    ...(Object.keys(gasSchedule) as ERC20BridgeSource[]).map(k => ({
        [k]: new BigNumber(gasSchedule[k] + 1.5e5),
    })),
);
const DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE = 0.03; // 3% Slippage
const DEFAULT_FALLBACK_SLIPPAGE_PERCENTAGE = 0.015; // 1.5% Slippage in a fallback route
export const ASSET_SWAPPER_MARKET_ORDERS_OPTS: Partial<SwapQuoteRequestOpts> = {
    excludedSources: [],
    bridgeSlippage: DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE,
    maxFallbackSlippage: DEFAULT_FALLBACK_SLIPPAGE_PERCENTAGE,
    numSamples: 13,
    sampleDistributionBase: 1.05,
    feeSchedule,
    gasSchedule,
};
