import { ContractWrappers } from '@0x/contract-wrappers';
import { assetDataUtils as sharedAssetDataUtils } from '@0x/order-utils';
import * as _ from 'lodash';

export const assetDataUtils = {
    ...sharedAssetDataUtils,
    getEtherTokenAssetData(contractWrappers: ContractWrappers): string {
        const etherTokenAddress = contractWrappers.forwarder.etherTokenAddress;
        const etherTokenAssetData = sharedAssetDataUtils.encodeERC20AssetData(etherTokenAddress);
        return etherTokenAssetData;
    },
};
