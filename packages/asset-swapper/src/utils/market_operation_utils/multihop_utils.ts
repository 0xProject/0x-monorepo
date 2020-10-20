import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { Omit } from '../../types';

import { ZERO_AMOUNT } from './constants';
import { getTwoHopAdjustedRate } from './rate_utils';
import {
    DexSample,
    ExchangeProxyOverhead,
    FeeSchedule,
    MarketSideLiquidity,
    MultiHopFillData,
    TokenAdjacencyGraph,
} from './types';

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
    exchangeProxyOverhead?: ExchangeProxyOverhead,
): { quote: DexSample<MultiHopFillData> | undefined; adjustedRate: BigNumber } {
    const { side, inputAmount, ethToOutputRate, twoHopQuotes } = marketSideLiquidity;
    // Ensure the expected data we require exists. In the case where all hops reverted
    // or there were no sources included that allowed for multi hop,
    // we can end up with empty, but not undefined, fill data
    const filteredQuotes = twoHopQuotes.filter(
        quote =>
            quote &&
            quote.fillData &&
            quote.fillData.firstHopSource &&
            quote.fillData.secondHopSource &&
            quote.output.isGreaterThan(ZERO_AMOUNT),
    );
    if (filteredQuotes.length === 0) {
        return { quote: undefined, adjustedRate: ZERO_AMOUNT };
    }
    const best = filteredQuotes
        .map(quote =>
            getTwoHopAdjustedRate(side, quote, inputAmount, ethToOutputRate, feeSchedule, exchangeProxyOverhead),
        )
        .reduce(
            (prev, curr, i) =>
                curr.isGreaterThan(prev.adjustedRate) ? { adjustedRate: curr, quote: filteredQuotes[i] } : prev,
            {
                adjustedRate: getTwoHopAdjustedRate(
                    side,
                    filteredQuotes[0],
                    inputAmount,
                    ethToOutputRate,
                    feeSchedule,
                    exchangeProxyOverhead,
                ),
                quote: filteredQuotes[0],
            },
        );
    return best;
}
