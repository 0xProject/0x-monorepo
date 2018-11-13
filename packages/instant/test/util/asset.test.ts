import { AssetProxyId, ObjectMap } from '@0x/types';

import { Asset, AssetMetaData, ERC20AssetMetaData, Network, ZeroExInstantError } from '../../src/types';
import { assetUtils } from '../../src/util/asset';

const ZRX_ASSET_DATA = '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498';
const ZRX_ASSET_DATA_KOVAN = '0xf47261b00000000000000000000000002002d3812f58e35f0ea1ffbf80a75a38c32175fa';
const ZRX_META_DATA: ERC20AssetMetaData = {
    assetProxyId: AssetProxyId.ERC20,
    symbol: 'zrx',
    decimals: 18,
    name: '0x',
};
const ZRX_ASSET: Asset = {
    assetData: ZRX_ASSET_DATA,
    metaData: ZRX_META_DATA,
};
const META_DATA_MAP: ObjectMap<AssetMetaData> = {
    [ZRX_ASSET_DATA]: ZRX_META_DATA,
};

describe('assetDataUtil', () => {
    describe('bestNameForAsset', () => {
        it('should return default string if assetData is undefined', () => {
            expect(assetUtils.bestNameForAsset(undefined, 'xyz')).toEqual('xyz');
        });
        it('should return ZRX for ZRX assetData', () => {
            expect(assetUtils.bestNameForAsset(ZRX_ASSET, 'mah default')).toEqual('ZRX');
        });
    });
    describe('getMetaDataOrThrow', () => {
        it('should return the metaData for the supplied mainnet asset data', () => {
            expect(assetUtils.getMetaDataOrThrow(ZRX_ASSET_DATA, META_DATA_MAP, Network.Mainnet)).toEqual(
                ZRX_META_DATA,
            );
        });
        it('should return the metaData for the supplied non-mainnet asset data', () => {
            expect(assetUtils.getMetaDataOrThrow(ZRX_ASSET_DATA_KOVAN, META_DATA_MAP, Network.Kovan)).toEqual(
                ZRX_META_DATA,
            );
        });
        it('should throw if the metaData for the asset is not available', () => {
            expect(() =>
                assetUtils.getMetaDataOrThrow('asset data we dont have', META_DATA_MAP, Network.Mainnet),
            ).toThrowError(ZeroExInstantError.AssetMetaDataNotAvailable);
        });
    });
});
