import { AssetProxyId } from '@0x/types';

import { AssetType } from '../../types';

/**
 * Converts an assetProxyId to its string equivalent
 * @param assetProxyId Id of AssetProxy
 */
export function convertAssetProxyIdToType(assetProxyId: AssetProxyId): AssetType {
    switch (assetProxyId) {
        case AssetProxyId.ERC20:
            return 'erc20';
        case AssetProxyId.ERC721:
            return 'erc721';
        case AssetProxyId.MultiAsset:
            return 'multiAsset';
        default:
            throw new Error(`${assetProxyId} not a supported assetProxyId`);
    }
}
