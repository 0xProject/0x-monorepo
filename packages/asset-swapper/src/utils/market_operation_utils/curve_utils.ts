import { MAINNET_CURVE_INFOS, MAINNET_SWERVE_INFOS } from './constants';
import { CurveInfo, SwerveInfo } from './types';

// tslint:disable completed-docs
export function getCurveInfosForPair(takerToken: string, makerToken: string): CurveInfo[] {
    return Object.values(MAINNET_CURVE_INFOS).filter(c => [makerToken, takerToken].every(t => c.tokens.includes(t)));
}

export function getSwerveInfosForPair(takerToken: string, makerToken: string): SwerveInfo[] {
    return Object.values(MAINNET_SWERVE_INFOS).filter(c => [makerToken, takerToken].every(t => c.tokens.includes(t)));
}
