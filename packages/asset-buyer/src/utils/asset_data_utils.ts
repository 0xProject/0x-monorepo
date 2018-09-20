import { ContractWrappers } from '@0xproject/contract-wrappers';
import { assetDataUtils as sharedAssetDataUtils } from '@0xproject/order-utils';
import * as _ from 'lodash';

import { AssetBuyerError } from '../types';

export const assetDataUtils = {
    ...sharedAssetDataUtils,
    getEtherTokenAssetDataOrThrow(contractWrappers: ContractWrappers): string {
        const etherTokenAddressIfExists = contractWrappers.etherToken.getContractAddressIfExists();
        if (_.isUndefined(etherTokenAddressIfExists)) {
            throw new Error(AssetBuyerError.NoEtherTokenContractFound);
        }
        const etherTokenAssetData = sharedAssetDataUtils.encodeERC20AssetData(etherTokenAddressIfExists);
        return etherTokenAssetData;
    },
    getZrxTokenAssetDataOrThrow(contractWrappers: ContractWrappers): string {
        let zrxTokenAssetData: string;
        try {
            zrxTokenAssetData = contractWrappers.exchange.getZRXAssetData();
        } catch (err) {
            throw new Error(AssetBuyerError.NoZrxTokenContractFound);
        }
        return zrxTokenAssetData;
    },
};
