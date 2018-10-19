import { AssetBuyerError } from '@0x/asset-buyer';
import { Dispatch } from 'redux';

import { Action, actions } from '../redux/actions';
import { assetDataUtil } from '../util/asset_data';

class ErrorFlasher {
    private _timeoutId?: number;
    public flashNewError(dispatch: Dispatch<Action>, error: any, delayMs: number = 7000): void {
        this._clearTimeout();

        // dispatch new message
        dispatch(actions.setError(error));

        this._timeoutId = window.setTimeout(() => {
            dispatch(actions.hideError());
        }, delayMs);
    }
    public clearError(dispatch: Dispatch<Action>): void {
        this._clearTimeout();
        dispatch(actions.hideError());
    }
    private _clearTimeout(): void {
        if (this._timeoutId) {
            window.clearTimeout(this._timeoutId);
        }
    }
}

const humanReadableMessageForError = (error: Error, assetData?: string): string | undefined => {
    const hasInsufficientLiquidity =
        error.message === AssetBuyerError.InsufficientAssetLiquidity ||
        error.message === AssetBuyerError.InsufficientZrxLiquidity;
    if (hasInsufficientLiquidity) {
        const assetName = assetDataUtil.bestNameForAsset(assetData, 'of this asset');
        return `Not enough ${assetName} available`;
    }

    if (
        error.message === AssetBuyerError.StandardRelayerApiError ||
        error.message.startsWith(AssetBuyerError.AssetUnavailable)
    ) {
        const assetName = assetDataUtil.bestNameForAsset(assetData, 'This asset');
        return `${assetName} is currently unavailable`;
    }

    return undefined;
};

export const errorUtil = {
    errorFlasher: new ErrorFlasher(),
    errorDescription: (error?: any, assetData?: string): { icon: string; message: string } => {
        let bestMessage: string | undefined;
        if (error instanceof Error) {
            bestMessage = humanReadableMessageForError(error, assetData);
        }
        return {
            icon: '😢',
            message: bestMessage || 'Something went wrong...',
        };
    },
};
