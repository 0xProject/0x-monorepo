import { AssetBuyer, BuyQuote } from '@0x/asset-buyer';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import { Dispatch } from 'redux';
import { oc } from 'ts-optchain';

import { Action, actions } from '../redux/actions';
import { AffiliateInfo, ERC20Asset, QuoteFetchOrigin } from '../types';
import { analytics } from '../util/analytics';
import { assetUtils } from '../util/asset';
import { errorFlasher } from '../util/error_flasher';
import { errorReporter } from '../util/error_reporter';

export const buyQuoteUpdater = {
    updateBuyQuoteAsync: async (
        assetBuyer: AssetBuyer,
        dispatch: Dispatch<Action>,
        asset: ERC20Asset,
        assetUnitAmount: BigNumber,
        fetchOrigin: QuoteFetchOrigin,
        options: {
            setPending: boolean;
            dispatchErrors: boolean;
            affiliateInfo?: AffiliateInfo;
        },
    ): Promise<void> => {
        // get a new buy quote.
        const baseUnitValue = Web3Wrapper.toBaseUnitAmount(assetUnitAmount, asset.metaData.decimals);
        if (options.setPending) {
            // mark quote as pending
            dispatch(actions.setQuoteRequestStatePending());
        }
        const feePercentage = oc(options.affiliateInfo).feePercentage();
        let newBuyQuote: BuyQuote | undefined;
        try {
            newBuyQuote = await assetBuyer.getBuyQuoteAsync(asset.assetData, baseUnitValue, { feePercentage });
        } catch (error) {
            const errorMessage = assetUtils.assetBuyerErrorMessage(asset, error);

            errorReporter.report(error);
            analytics.trackQuoteError(error.message ? error.message : 'other', baseUnitValue, fetchOrigin);

            if (options.dispatchErrors) {
                dispatch(actions.setQuoteRequestStateFailure());
                errorFlasher.flashNewErrorMessage(dispatch, errorMessage || 'Error fetching price, please try again');
            }
            return;
        }
        // We have a successful new buy quote
        errorFlasher.clearError(dispatch);
        // invalidate the last buy quote.
        dispatch(actions.updateLatestBuyQuote(newBuyQuote));
        analytics.trackQuoteFetched(newBuyQuote, fetchOrigin);
    },
};
