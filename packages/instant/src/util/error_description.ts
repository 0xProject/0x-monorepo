import { AssetBuyerError } from '@0xproject/asset-buyer';

import { bestNameForAsset } from '../util/asset_data';

const humanReadableMessageForError = (error: Error, assetData?: string): string | undefined => {
    if (error.message === AssetBuyerError.InsufficientAssetLiquidity) {
        const assetName = bestNameForAsset(assetData, 'of this asset');
        return `Not enough ${assetName} available`;
    }

    return undefined;
};

export const errorDescription = (error?: any, assetData?: string): { icon: string; message: string } => {
    let bestMessage: string | undefined;
    if (error instanceof Error) {
        bestMessage = humanReadableMessageForError(error, assetData);
    }
    return {
        icon: '😢',
        message: bestMessage || 'Something went wrong...',
    };
};
