import { AssetProxyId, ObjectMap } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { BIG_NUMBER_ZERO, DEFAULT_UNKOWN_ASSET_NAME } from '../constants';
import { assetDataNetworkMapping } from '../data/asset_data_network_mapping';
import { Asset, AssetMetaData, ERC20Asset, Network, ZeroExInstantError } from '../types';

export const assetUtils = {
    createAssetsFromAssetDatas: (
        assetDatas: string[],
        assetMetaDataMap: ObjectMap<AssetMetaData>,
        network: Network,
    ): Asset[] => {
        const arrayOfAssetOrUndefined = _.map(assetDatas, assetData =>
            assetUtils.createAssetFromAssetDataIfExists(assetData, assetMetaDataMap, network),
        );
        return _.compact(arrayOfAssetOrUndefined);
    },
    createAssetFromAssetDataIfExists: (
        assetData: string,
        assetMetaDataMap: ObjectMap<AssetMetaData>,
        network: Network,
    ): Asset | undefined => {
        const metaData = assetUtils.getMetaDataIfExists(assetData, assetMetaDataMap, network);
        if (metaData === undefined) {
            return;
        }
        return {
            assetData: assetData.toLowerCase(),
            metaData,
        };
    },
    createAssetFromAssetDataOrThrow: (
        assetData: string,
        assetMetaDataMap: ObjectMap<AssetMetaData>,
        network: Network,
    ): Asset => {
        return {
            assetData: assetData.toLowerCase(),
            metaData: assetUtils.getMetaDataOrThrow(assetData, assetMetaDataMap, network),
        };
    },
    getMetaDataOrThrow: (assetData: string, metaDataMap: ObjectMap<AssetMetaData>, network: Network): AssetMetaData => {
        const metaDataIfExists = assetUtils.getMetaDataIfExists(assetData, metaDataMap, network);
        if (metaDataIfExists === undefined) {
            throw new Error(ZeroExInstantError.AssetMetaDataNotAvailable);
        }
        return metaDataIfExists;
    },
    getMetaDataIfExists: (
        assetData: string,
        metaDataMap: ObjectMap<AssetMetaData>,
        network: Network,
    ): AssetMetaData | undefined => {
        let mainnetAssetData: string | undefined = assetData;
        if (network !== Network.Mainnet) {
            const mainnetAssetDataIfExists = assetUtils.getAssociatedAssetDataIfExists(
                assetData.toLowerCase(),
                network,
            );
            // Just so we don't fail in the case where we are on a non-mainnet network,
            // but pass in a valid mainnet assetData.
            mainnetAssetData = mainnetAssetDataIfExists || assetData;
        }
        if (mainnetAssetData === undefined) {
            return;
        }
        const metaData = metaDataMap[mainnetAssetData.toLowerCase()];
        if (metaData === undefined) {
            return;
        }
        return metaData;
    },
    bestNameForAsset: (asset?: Asset, defaultName: string = DEFAULT_UNKOWN_ASSET_NAME): string => {
        if (asset === undefined) {
            return defaultName;
        }
        const metaData = asset.metaData;
        switch (metaData.assetProxyId) {
            case AssetProxyId.ERC20:
                return metaData.symbol.toUpperCase();
            case AssetProxyId.ERC721:
                return metaData.name;
        }
    },
    formattedSymbolForAsset: (asset?: ERC20Asset, defaultName: string = '???'): string => {
        if (asset === undefined) {
            return defaultName;
        }
        const symbol = asset.metaData.symbol;
        if (symbol.length <= 5) {
            return symbol;
        }
        return `${symbol.slice(0, 3)}…`;
    },
    getAssociatedAssetDataIfExists: (assetData: string, network: Network): string | undefined => {
        const assetDataGroupIfExists = _.find(assetDataNetworkMapping, value => value[network] === assetData);
        if (assetDataGroupIfExists === undefined) {
            return;
        }
        return assetDataGroupIfExists[Network.Mainnet];
    },
    getERC20AssetsFromAssets: (assets: Asset[]): ERC20Asset[] => {
        const erc20sOrUndefined = _.map(assets, asset =>
            asset.metaData.assetProxyId === AssetProxyId.ERC20 ? (asset as ERC20Asset) : undefined,
        );
        return _.compact(erc20sOrUndefined);
    },
    // TODO
    // swapQuoterErrorMessage: (asset: Asset, error: Error): string | undefined => {
    //     if (error.message === SwapQuoterError.InsufficientAssetLiquidity) {
    //         const assetName = assetUtils.bestNameForAsset(asset, 'of this asset');
    //         if (
    //             error instanceof InsufficientAssetLiquidityError &&
    //             error.amountAvailableToFill.isGreaterThan(BIG_NUMBER_ZERO)
    //         ) {
    //             const unitAmountAvailableToFill =
    //                 asset.metaData.assetProxyId === AssetProxyId.ERC20
    //                     ? Web3Wrapper.toUnitAmount(error.amountAvailableToFill, asset.metaData.decimals)
    //                     : error.amountAvailableToFill;
    //             const roundedUnitAmountAvailableToFill = unitAmountAvailableToFill.decimalPlaces(
    //                 2,
    //                 BigNumber.ROUND_DOWN,
    //             );

    //             if (roundedUnitAmountAvailableToFill.isGreaterThan(BIG_NUMBER_ZERO)) {
    //                 return `There are only ${roundedUnitAmountAvailableToFill} ${assetName} available to buy`;
    //             }
    //         }

    //         return `Not enough ${assetName} available`;
    //     } else if (
    //         error.message === SwapQuoterError.StandardRelayerApiError ||
    //         error.message.startsWith(SwapQuoterError.AssetUnavailable)
    //     ) {
    //         const assetName = assetUtils.bestNameForAsset(asset, 'This asset');
    //         return `${assetName} is currently unavailable`;
    //     }

    //     return undefined;
    // },
};
