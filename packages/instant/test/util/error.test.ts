import { AssetBuyerError } from '@0xproject/asset-buyer';

import { errorUtil } from '../../src/util/error';

const ZRX_ASSET_DATA = '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498';

describe('errorUtil', () => {
    describe('errorFlasher', () => {
        it('should return error and asset name for InsufficientAssetLiquidity', () => {
            const insufficientAssetError = new Error(AssetBuyerError.InsufficientAssetLiquidity);
            expect(errorUtil.errorDescription(insufficientAssetError, ZRX_ASSET_DATA).message).toEqual(
                'Not enough ZRX available',
            );
        });
        it('should return error default name for InsufficientAssetLiquidity', () => {
            const insufficientZrxError = new Error(AssetBuyerError.InsufficientZrxLiquidity);
            expect(errorUtil.errorDescription(insufficientZrxError).message).toEqual(
                'Not enough of this asset available',
            );
        });
        it('should return asset name for InsufficientAssetLiquidity', () => {
            const insufficientZrxError = new Error(AssetBuyerError.InsufficientZrxLiquidity);
            expect(errorUtil.errorDescription(insufficientZrxError, ZRX_ASSET_DATA).message).toEqual(
                'Not enough ZRX available',
            );
        });
        it('should return unavailable error and asset name for StandardRelayerApiError', () => {
            const standardRelayerError = new Error(AssetBuyerError.StandardRelayerApiError);
            expect(errorUtil.errorDescription(standardRelayerError, ZRX_ASSET_DATA).message).toEqual(
                'ZRX is currently unavailable',
            );
        });
        it('should return error for AssetUnavailable error', () => {
            const assetUnavailableError = new Error(
                `${AssetBuyerError.AssetUnavailable}: For assetData ${ZRX_ASSET_DATA}`,
            );
            expect(errorUtil.errorDescription(assetUnavailableError, ZRX_ASSET_DATA).message).toEqual(
                'ZRX is currently unavailable',
            );
        });
        it('should return default for AssetUnavailable error', () => {
            const assetUnavailableError = new Error(`${AssetBuyerError.AssetUnavailable}: For assetData xyz`);
            expect(errorUtil.errorDescription(assetUnavailableError, 'xyz').message).toEqual(
                'This asset is currently unavailable',
            );
        });
    });
});
