import { BigNumber } from '@0x/utils';

export abstract class AbstractBalanceAndProxyAllowanceLazyStore {
    public abstract async getBalanceAsync(assetData: string, userAddress: string): Promise<BigNumber>;
    public abstract async getProxyAllowanceAsync(assetData: string, userAddress: string): Promise<BigNumber>;
    public abstract setBalance(assetData: string, userAddress: string, balance: BigNumber): void;
    public abstract deleteBalance(assetData: string, userAddress: string): void;
    public abstract setProxyAllowance(assetData: string, userAddress: string, proxyAllowance: BigNumber): void;
    public abstract deleteProxyAllowance(assetData: string, userAddress: string): void;
    public abstract deleteAll(): void;
}
