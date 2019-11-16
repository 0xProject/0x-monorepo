import { BigNumber, InsufficientAssetLiquidityError, SwapQuoterError } from '@0x/asset-swapper';
import { AssetProxyId, ObjectMap } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { Asset, AssetMetaData, ERC20Asset, ERC20AssetMetaData, Network, ZeroExInstantError } from '../../src/types';
import { assetUtils } from '../../src/util/asset';

const ZRX_ASSET_DATA = '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498';
const ZRX_ASSET_DATA_KOVAN = '0xf47261b00000000000000000000000002002d3812f58e35f0ea1ffbf80a75a38c32175fa';
const ZRX_META_DATA: ERC20AssetMetaData = {
    assetProxyId: AssetProxyId.ERC20,
    symbol: 'zrx',
    decimals: 18,
    name: '0x',
};
const ZRX_ASSET: ERC20Asset = {
    assetData: ZRX_ASSET_DATA,
    metaData: ZRX_META_DATA,
};
const META_DATA_MAP: ObjectMap<AssetMetaData> = {
    [ZRX_ASSET_DATA]: ZRX_META_DATA,
};
const WAX_ASSET: ERC20Asset = {
    assetData: '0xf47261b000000000000000000000000039bb259f66e1c59d5abef88375979b4d20d98022',
    metaData: {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 8,
        primaryColor: '#EDB740',
        symbol: 'wax',
        name: 'WAX',
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
    describe('assetBuyerErrorMessage', () => {
        it('should return message for generic InsufficientAssetLiquidity error', () => {
            const insufficientAssetError = new Error(SwapQuoterError.InsufficientAssetLiquidity);
            expect(assetUtils.swapQuoterErrorMessage(ZRX_ASSET, insufficientAssetError)).toEqual(
                'Not enough ZRX available',
            );
        });
        describe('InsufficientAssetLiquidityError', () => {
            it('should return custom message for token w/ 18 decimals', () => {
                const amountAvailable = Web3Wrapper.toBaseUnitAmount(new BigNumber(20.059), 18);
                expect(
                    assetUtils.swapQuoterErrorMessage(ZRX_ASSET, new InsufficientAssetLiquidityError(amountAvailable)),
                ).toEqual('There are only 20.05 ZRX available to buy');
            });
            it('should return custom message for token w/ 18 decimals and small amount available', () => {
                const amountAvailable = Web3Wrapper.toBaseUnitAmount(new BigNumber(0.01), 18);
                expect(
                    assetUtils.swapQuoterErrorMessage(ZRX_ASSET, new InsufficientAssetLiquidityError(amountAvailable)),
                ).toEqual('There are only 0.01 ZRX available to buy');
            });
            it('should return custom message for token w/ 8 decimals', () => {
                const amountAvailable = Web3Wrapper.toBaseUnitAmount(new BigNumber(3), 8);
                expect(
                    assetUtils.swapQuoterErrorMessage(WAX_ASSET, new InsufficientAssetLiquidityError(amountAvailable)),
                ).toEqual('There are only 3 WAX available to buy');
            });
            it('should return generic message when amount available rounds to zero', () => {
                const amountAvailable = Web3Wrapper.toBaseUnitAmount(new BigNumber(0.002), 18);
                expect(
                    assetUtils.swapQuoterErrorMessage(ZRX_ASSET, new InsufficientAssetLiquidityError(amountAvailable)),
                ).toEqual('Not enough ZRX available');
            });
        });
        it('should message for StandardRelayerApiError', () => {
            const standardRelayerError = new Error(SwapQuoterError.StandardRelayerApiError);
            expect(assetUtils.swapQuoterErrorMessage(ZRX_ASSET, standardRelayerError)).toEqual(
                'ZRX is currently unavailable',
            );
        });
        it('should return error for AssetUnavailable error', () => {
            const assetUnavailableError = new Error(
                `${SwapQuoterError.AssetUnavailable}: For assetData ${ZRX_ASSET_DATA}`,
            );
            expect(assetUtils.swapQuoterErrorMessage(ZRX_ASSET, assetUnavailableError)).toEqual(
                'ZRX is currently unavailable',
            );
        });
    });
});
