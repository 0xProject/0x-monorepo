import { DEFAULT_CURVE_OPTS } from './market_operation_utils/constants';
import { ERC20BridgeSource } from './market_operation_utils/types';

export const isCurveSource = (source: ERC20BridgeSource): boolean => {
    return Object.keys(DEFAULT_CURVE_OPTS).includes(source);
};

export const getCurveInfo = (
    source: ERC20BridgeSource,
    takerToken: string,
    makerToken: string,
): { curveAddress: string; fromTokenIdx: number; toTokenIdx: number; version: number } => {
    const { curveAddress, tokens, version } = DEFAULT_CURVE_OPTS[source];
    const fromTokenIdx = tokens.indexOf(takerToken);
    const toTokenIdx = tokens.indexOf(makerToken);
    return { curveAddress, fromTokenIdx, toTokenIdx, version };
};
