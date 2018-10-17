import { assetDataUtil } from '../../src/util/asset_data';

const ZRX_ASSET_DATA = '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498';

describe('assetDataUtil', () => {
    describe('bestNameForAsset', () => {
        it('should return default string if assetData is undefined', () => {
            expect(assetDataUtil.bestNameForAsset(undefined, 'xyz')).toEqual('xyz');
        });
        it('should return default string if assetData isnt found', () => {
            expect(assetDataUtil.bestNameForAsset('fake', 'mah default')).toEqual('mah default');
        });
        it('should return ZRX for ZRX assetData', () => {
            expect(assetDataUtil.bestNameForAsset(ZRX_ASSET_DATA, 'mah default')).toEqual('ZRX');
        });
    });
});
