import { ContractWrappers } from '@0xproject/contract-wrappers';
import { assetDataUtils as sharedAssetDataUtils } from '@0xproject/order-utils';
import * as _ from 'lodash';

export const assetDataUtils = {
    ...sharedAssetDataUtils,
    getEtherTokenAssetData(contractWrappers: ContractWrappers): string {
        const etherTokenAddress = contractWrappers.forwarder.etherTokenAddress;
        const etherTokenAssetData = sharedAssetDataUtils.encodeERC20AssetData(etherTokenAddress);
        return etherTokenAssetData;
    },
};
