import { assetProxyUtils } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { AbstractAssetWrapper } from '../abstract/abstract_asset_wrapper';

interface ProxyIdToAssetWrappers {
    [proxyId: number]: AbstractAssetWrapper;
}

export class AssetWrapper {
    private _proxyIdToAssetWrappers: ProxyIdToAssetWrappers;
    constructor(assetWrappers: AbstractAssetWrapper[]) {
        this._proxyIdToAssetWrappers = {};
        _.each(assetWrappers, assetWrapper => {
            const proxyId = assetWrapper.getProxyId();
            this._proxyIdToAssetWrappers[proxyId] = assetWrapper;
        });
    }
    public async getBalanceAsync(owner: string, assetData: string): Promise<BigNumber> {
        const proxyId = assetProxyUtils.decodeAssetDataId(assetData);
        const assetWrapper = this._proxyIdToAssetWrappers[proxyId];
        const balance = await assetWrapper.getBalanceAsync(owner, assetData);
        return balance;
    }
    public async getProxyAllowanceAsync(owner: string, assetData: string): Promise<BigNumber> {
        const proxyId = assetProxyUtils.decodeAssetDataId(assetData);
        const assetWrapper = this._proxyIdToAssetWrappers[proxyId];
        const balance = await assetWrapper.getProxyAllowanceAsync(owner, assetData);
        return balance;
    }
}
