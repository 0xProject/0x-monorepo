import { AbstractBalanceAndProxyAllowanceFetcher } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';

import { AssetWrapper } from './asset_wrapper';

export class SimpleAssetBalanceAndProxyAllowanceFetcher implements AbstractBalanceAndProxyAllowanceFetcher {
    private _assetWrapper: AssetWrapper;
    constructor(assetWrapper: AssetWrapper) {
        this._assetWrapper = assetWrapper;
    }
    public async getBalanceAsync(assetData: string, userAddress: string): Promise<BigNumber> {
        const balance = await this._assetWrapper.getBalanceAsync(userAddress, assetData);
        return balance;
    }
    public async getProxyAllowanceAsync(assetData: string, userAddress: string): Promise<BigNumber> {
        const proxyAllowance = await this._assetWrapper.getProxyAllowanceAsync(userAddress, assetData);
        return proxyAllowance;
    }
}
