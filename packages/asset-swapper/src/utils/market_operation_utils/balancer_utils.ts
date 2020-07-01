import { BigNumber } from '@0x/utils';
import { bmath, getPoolsWithTokens, parsePoolData } from '@balancer-labs/sor';
import * as _ from 'lodash';

export interface BalancerPool {
    id: string;
    balanceIn: BigNumber;
    balanceOut: BigNumber;
    weightIn: BigNumber;
    weightOut: BigNumber;
    swapFee: BigNumber;
    spotPrice?: BigNumber;
    slippage?: BigNumber;
    limitAmount?: BigNumber;
}

export const getBalancerPoolsForPairAsync = async (takerToken: string, makerToken: string): Promise<BalancerPool[]> => {
    return parsePoolData(await getPoolsWithTokens(takerToken, makerToken), takerToken, makerToken);
};

export const computeBalancerSellQuote = (pool: BalancerPool, takerFillAmount: BigNumber): BigNumber => {
    return bmath.calcOutGivenIn(
        pool.balanceIn,
        pool.weightIn,
        pool.balanceOut,
        pool.weightOut,
        takerFillAmount,
        pool.swapFee,
    );
};

export const computeBalancerBuyQuote = (pool: BalancerPool, makerFillAmount: BigNumber): BigNumber => {
    return bmath.calcInGivenOut(
        pool.balanceIn,
        pool.weightIn,
        pool.balanceOut,
        pool.weightOut,
        makerFillAmount,
        pool.swapFee,
    );
};
