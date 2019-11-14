import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { AbstractBalanceAndProxyAllowanceFetcher } from './abstract/abstract_balance_and_proxy_allowance_fetcher';

export class AssetBalanceAndProxyAllowanceFetcher implements AbstractBalanceAndProxyAllowanceFetcher {
    private readonly _devUtilsContract: DevUtilsContract;
    constructor(devUtilsContract: DevUtilsContract) {
        this._devUtilsContract = devUtilsContract;
    }
    public async getBalanceAsync(assetData: string, userAddress: string): Promise<BigNumber> {
        const balance = await this._devUtilsContract.getBalance(userAddress, assetData).callAsync();
        return balance;
    }
    public async getProxyAllowanceAsync(assetData: string, userAddress: string): Promise<BigNumber> {
        const proxyAllowance = await this._devUtilsContract.getAssetProxyAllowance(userAddress, assetData).callAsync();
        return proxyAllowance;
    }
}
