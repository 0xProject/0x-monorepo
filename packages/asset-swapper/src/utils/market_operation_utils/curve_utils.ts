import { MAINNET_CURVE_INFOS } from './constants';
import { CurveInfo } from './types';

// tslint:disable completed-docs
export function getCurveInfosForPair(takerToken: string, makerToken: string): CurveInfo[] {
    return Object.values(MAINNET_CURVE_INFOS).filter(c => [makerToken, takerToken].every(t => c.tokens.includes(t)));
}
