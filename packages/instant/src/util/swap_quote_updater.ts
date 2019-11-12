import { SwapQuote, SwapQuoter } from '@0x/asset-swapper';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import { Dispatch } from 'redux';
import { oc } from 'ts-optchain';

import { ERC20_SWAP_QUOTE_SLIPPAGE_PERCENTAGE, ERC721_SWAP_QUOTE_SLIPPAGE_PERCENTAGE } from '../constants';
import { Action, actions } from '../redux/actions';
import { AffiliateInfo, Asset, QuoteFetchOrigin } from '../types';
import { analytics } from './analytics';
import { assetUtils } from './asset';
import { errorFlasher } from './error_flasher';
import { errorReporter } from './error_reporter';

export const swapQuoteUpdater = {
    updateSwapQuoteAsync: async (
        swapQuoter: SwapQuoter,
        dispatch: Dispatch<Action>,
        asset: Asset,
        assetUnitAmount: BigNumber,
        fetchOrigin: QuoteFetchOrigin,
        options: {
            setPending: boolean;
            dispatchErrors: boolean;
            affiliateInfo?: AffiliateInfo;
        },
    ): Promise<void> => {
        // get a new swap quote.
        const baseUnitValue =
            asset.metaData.assetProxyId === AssetProxyId.ERC20
                ? Web3Wrapper.toBaseUnitAmount(assetUnitAmount, asset.metaData.decimals)
                : assetUnitAmount;
        if (options.setPending) {
            // mark quote as pending
            dispatch(actions.setQuoteRequestStatePending());
        }
        // TODO(dave4506) expose wethAssetData + feePercentage utils
        const wethAssetData = '';
        const feePercentage = oc(options.affiliateInfo).feePercentage();
        let newSwapQuote: SwapQuote | undefined;
        const slippagePercentage =
            asset.metaData.assetProxyId === AssetProxyId.ERC20
                ? ERC20_SWAP_QUOTE_SLIPPAGE_PERCENTAGE
                : ERC721_SWAP_QUOTE_SLIPPAGE_PERCENTAGE;
        try {
            newSwapQuote = await swapQuoter.getMarketBuySwapQuoteAsync(wethAssetData, asset.assetData, assetUnitAmount, {
                slippagePercentage,
            });
        } catch (error) {
            const errorMessage = assetUtils.swapQuoterErrorMessage(asset, error);

            errorReporter.report(error);
            analytics.trackQuoteError(error.message ? error.message : 'other', baseUnitValue, fetchOrigin);

            if (options.dispatchErrors) {
                dispatch(actions.setQuoteRequestStateFailure());
                errorFlasher.flashNewErrorMessage(dispatch, errorMessage || 'Error fetching price, please try again');
            }
            return;
        }
        // We have a successful new swap quote
        errorFlasher.clearError(dispatch);
        // invalidate the last swap quote.
        dispatch(actions.updateLatestSwapQuote(newSwapQuote));
        analytics.trackQuoteFetched(newSwapQuote, fetchOrigin);
    },
};
