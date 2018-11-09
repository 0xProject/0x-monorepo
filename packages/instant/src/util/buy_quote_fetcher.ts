// TODO: rename file and export object
import { AssetBuyer, AssetBuyerError, BuyQuote } from '@0x/asset-buyer';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import { Dispatch } from 'redux';
import { oc } from 'ts-optchain';

import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { AffiliateInfo, ERC20Asset } from '../types';
import { assetUtils } from '../util/asset';

import { errorFlasher } from './error_flasher';

export const updateBuyQuoteOrFlashErrorAsync = async (
    assetBuyer: AssetBuyer,
    asset: ERC20Asset,
    assetAmount: BigNumber,
    dispatch: Dispatch<Action>,
    affiliateInfo?: AffiliateInfo,
) => {
    // get a new buy quote.
    const baseUnitValue = Web3Wrapper.toBaseUnitAmount(assetAmount, asset.metaData.decimals);

    const feePercentage = oc(affiliateInfo).feePercentage();
    let newBuyQuote: BuyQuote | undefined;
    try {
        newBuyQuote = await assetBuyer.getBuyQuoteAsync(asset.assetData, baseUnitValue, { feePercentage });
    } catch (error) {
        dispatch(actions.setQuoteRequestStateFailure());
        let errorMessage;
        if (error.message === AssetBuyerError.InsufficientAssetLiquidity) {
            const assetName = assetUtils.bestNameForAsset(asset, 'of this asset');
            errorMessage = `Not enough ${assetName} available`;
        } else if (error.message === AssetBuyerError.InsufficientZrxLiquidity) {
            errorMessage = 'Not enough ZRX available';
        } else if (
            error.message === AssetBuyerError.StandardRelayerApiError ||
            error.message.startsWith(AssetBuyerError.AssetUnavailable)
        ) {
            const assetName = assetUtils.bestNameForAsset(asset, 'This asset');
            errorMessage = `${assetName} is currently unavailable`;
        }
        if (!_.isUndefined(errorMessage)) {
            errorFlasher.flashNewErrorMessage(dispatch, errorMessage);
        } else {
            throw error;
        }
        return;
    }
    // We have a successful new buy quote
    errorFlasher.clearError(dispatch);
    // invalidate the last buy quote.
    dispatch(actions.updateLatestBuyQuote(newBuyQuote));
};

export const updateBuyQuoteOrFlashErrorAsyncForState = async (state: State, dispatch: Dispatch<Action>) => {
    const { selectedAsset, selectedAssetAmount, affiliateInfo } = state;
    const assetBuyer = state.providerState.assetBuyer;

    if (selectedAsset && selectedAssetAmount && selectedAsset.metaData.assetProxyId === AssetProxyId.ERC20) {
        // TODO: maybe dont do in the case of an error showing
        updateBuyQuoteOrFlashErrorAsync(
            assetBuyer,
            selectedAsset as ERC20Asset, // TODO: better way to do this?
            selectedAssetAmount,
            dispatch,
            affiliateInfo,
        );
    }
};
