import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { Omit } from '../../types';

import { ZERO_AMOUNT } from './constants';
import { getTwoHopAdjustedRate } from './fills';
import { DexSample, FeeSchedule, MarketSideLiquidity, MultiHopFillData, TokenAdjacencyGraph } from './types';

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
    return intermediateTokens.filter(
        token => token.toLowerCase() !== makerToken.toLowerCase() && token.toLowerCase() !== takerToken.toLowerCase(),
    );
}

/**
 * Returns the best two-hop quote and the fee-adjusted rate of that quote.
 */
export function getBestTwoHopQuote(
    marketSideLiquidity: Omit<MarketSideLiquidity, 'makerTokenDecimals' | 'takerTokenDecimals'>,
    feeSchedule?: FeeSchedule,
): { quote: DexSample<MultiHopFillData> | undefined; adjustedRate: BigNumber } {
    const { side, inputAmount, ethToOutputRate, twoHopQuotes } = marketSideLiquidity;
    if (twoHopQuotes.length === 0) {
        return { adjustedRate: ZERO_AMOUNT, quote: undefined };
    }
    const best = twoHopQuotes
        .map(quote => getTwoHopAdjustedRate(side, quote, inputAmount, ethToOutputRate, feeSchedule))
        .reduce(
            (prev, curr, i) =>
                curr.isGreaterThan(prev.adjustedRate) ? { adjustedRate: curr, quote: twoHopQuotes[i] } : prev,
            {
                adjustedRate: getTwoHopAdjustedRate(side, twoHopQuotes[0], inputAmount, ethToOutputRate, feeSchedule),
                quote: twoHopQuotes[0],
            },
        );
    return best;
}
