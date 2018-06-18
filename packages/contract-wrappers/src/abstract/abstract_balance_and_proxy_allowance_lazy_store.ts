import { BigNumber } from '@0xproject/utils';

export abstract class AbstractBalanceAndProxyAllowanceLazyStore {
    public abstract async getBalanceAsync(tokenAddress: string, userAddress: string): Promise<BigNumber>;
    public abstract async getProxyAllowanceAsync(tokenAddress: string, userAddress: string): Promise<BigNumber>;
    public abstract setBalance(tokenAddress: string, userAddress: string, balance: BigNumber): void;
    public abstract deleteBalance(tokenAddress: string, userAddress: string): void;
    public abstract setProxyAllowance(tokenAddress: string, userAddress: string, proxyAllowance: BigNumber): void;
    public abstract deleteProxyAllowance(tokenAddress: string, userAddress: string): void;
    public abstract deleteAll(): void;
}
