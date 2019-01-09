import { AssetProxyId } from '@0x/types';

import { AssetType } from '../../types';

/**
 * Converts an assetProxyId to its string equivalent
 * @param assetProxyId Id of AssetProxy
 */
export function convertAssetProxyIdToType(assetProxyId: AssetProxyId): AssetType {
    switch (assetProxyId) {
        case AssetProxyId.ERC20:
            return AssetType.ERC20;
        case AssetProxyId.ERC721:
            return AssetType.ERC721;
        case AssetProxyId.MultiAsset:
            return AssetType.MultiAsset;
        default:
            throw new Error(`${assetProxyId} not a supported assetProxyId`);
    }
}
