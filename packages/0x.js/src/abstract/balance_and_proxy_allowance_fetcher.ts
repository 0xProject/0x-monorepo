import { BigNumber } from '@0xproject/utils';

export abstract class BalanceAndProxyAllowanceFetcher {
    public abstract async getBalanceAsync(tokenAddress: string, userAddress: string): Promise<BigNumber>;
    public abstract async getProxyAllowanceAsync(tokenAddress: string, userAddress: string): Promise<BigNumber>;
}
