import { AssetProxyId } from '@0x/types';

import { Asset } from '../../src/types';
import { assetUtils } from '../../src/util/asset';

const ZRX_ASSET_DATA = '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498';
const ZRX_ASSET: Asset = {
    assetData: ZRX_ASSET_DATA,
    metaData: {
        assetProxyId: AssetProxyId.ERC20,
        symbol: 'zrx',
        decimals: 18,
    },
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
});
