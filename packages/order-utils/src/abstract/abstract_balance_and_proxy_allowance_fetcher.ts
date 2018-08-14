import { BigNumber } from '@0xproject/utils';

export abstract class AbstractBalanceAndProxyAllowanceFetcher {
    public abstract async getBalanceAsync(assetData: string, userAddress: string): Promise<BigNumber>;
    public abstract async getProxyAllowanceAsync(assetData: string, userAddress: string): Promise<BigNumber>;
}
