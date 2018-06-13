import { BigNumber } from '@0xproject/utils';

export abstract class AbstractAssetWrapper {
    public abstract getProxyId(): number;
    public abstract async setBalancesAndAllowancesAsync(): Promise<void>;
    public abstract async getBalanceAsync(owner: string, assetData: string): Promise<BigNumber>;
    public abstract async getProxyAllowanceAsync(owner: string, assetData: string): Promise<BigNumber>;
    public abstract getTokenOwnerAddresses(): string[];
    public abstract getTokenAddresses(): string[];
}
