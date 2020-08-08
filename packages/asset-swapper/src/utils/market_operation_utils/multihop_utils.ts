import * as _ from 'lodash';

export const TOKEN_ADJACENCY_GRAPH: { [token: string]: string[] } = {
    // renBTC: wBTC
    // TUSD: USDC, DAI
    // USDT: USDC, DAI
    // COMP: USDC
    // LEND: USDC
    // SNX: USDC
};

export function getIntermediateTokens(makerToken: string, takerToken: string, wethAddress: string): string[] {
    let intermediateTokens = [];
    if (makerToken === wethAddress) {
        intermediateTokens = _.get(TOKEN_ADJACENCY_GRAPH, takerToken, [] as string[]);
    } else if (takerToken === wethAddress) {
        intermediateTokens = _.get(TOKEN_ADJACENCY_GRAPH, makerToken, [] as string[]);
    } else {
        intermediateTokens = _.intersection(
            _.get(TOKEN_ADJACENCY_GRAPH, takerToken, [wethAddress]),
            _.get(TOKEN_ADJACENCY_GRAPH, makerToken, [wethAddress]),
        );
    }
    return intermediateTokens;
}
