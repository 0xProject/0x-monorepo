import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { FeeSchedule, SourceInfo, TokenAdjacencyGraph } from './types';

/**
 * Given a token pair, returns the intermediate tokens to consider for two-hop routes.
 */
export function getIntermediateTokens(
    makerToken: string,
    takerToken: string,
    tokenAdjacencyGraph: TokenAdjacencyGraph,
    wethAddress: string,
): string[] {
    let intermediateTokens = [];
    if (makerToken === wethAddress) {
        intermediateTokens = _.get(tokenAdjacencyGraph, takerToken, [] as string[]);
    } else if (takerToken === wethAddress) {
        intermediateTokens = _.get(tokenAdjacencyGraph, makerToken, [] as string[]);
    } else {
        intermediateTokens = _.union(
            _.intersection(_.get(tokenAdjacencyGraph, takerToken, []), _.get(tokenAdjacencyGraph, makerToken, [])),
            [wethAddress],
        );
    }
    return intermediateTokens;
}

/**
 * Computes the estimated fee for a multi-hop path.
 */
export function getMultiHopFee(hops: SourceInfo[], fees: FeeSchedule): number {
    return BigNumber.sum(
        ...hops.map(hop => (fees[hop.source] === undefined ? 0 : fees[hop.source]!(hop.fillData))),
    ).toNumber();
}
