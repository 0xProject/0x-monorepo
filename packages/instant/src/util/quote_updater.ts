import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId, ERC20AssetData, ERC721AssetData } from '@0x/types';
import { BigNumber, fetchAsync } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Dispatch } from 'redux';

import { ERC20_SWAP_QUOTE_SLIPPAGE_PERCENTAGE, ERC721_SWAP_QUOTE_SLIPPAGE_PERCENTAGE, SELL_TOKEN_SYMBOL, ZERO_EX_API_BASE_URL, ZERO_EX_API_SWAP_ENDPOINT } from '../constants';
import { Action, actions } from '../redux/actions';
import { Asset, QuoteFetchOrigin, ZeroExAPIQuoteParams, ZeroExAPIQuoteResponse } from '../types';

import { analytics } from './analytics';
import { apiUtils } from './api_utils';
import { assetUtils } from './asset';
import { errorFlasher } from './error_flasher';
import { errorReporter } from './error_reporter';

export const quoteUpdater = {
    updateSwapQuoteAsync: async (
        dispatch: Dispatch<Action>,
        asset: Asset,
        assetUnitAmount: BigNumber,
        fetchOrigin: QuoteFetchOrigin,
        options: {
            setPending: boolean;
            dispatchErrors: boolean;
            takerAddress?: string;
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

        const buyToken = asset.metaData.assetProxyId === AssetProxyId.ERC20 ? 
            (assetDataUtils.decodeAssetDataOrThrow(asset.assetData) as ERC20AssetData).tokenAddress :
            (assetDataUtils.decodeAssetDataOrThrow(asset.assetData) as ERC721AssetData).tokenAddress;

        const slippagePercentage =
            asset.metaData.assetProxyId === AssetProxyId.ERC20
                ? ERC20_SWAP_QUOTE_SLIPPAGE_PERCENTAGE
                : ERC721_SWAP_QUOTE_SLIPPAGE_PERCENTAGE;

        const apiParams: ZeroExAPIQuoteParams = {
            sellToken: SELL_TOKEN_SYMBOL,
            buyToken,
            buyAmount: baseUnitValue.toString(),
            slippagePercentage: slippagePercentage.toString(),
            takerAddress: options.takerAddress,
        };
        const res = await fetchAsync(`${ZERO_EX_API_BASE_URL}${ZERO_EX_API_SWAP_ENDPOINT}`);
        let newQuote: ZeroExAPIQuoteResponse | undefined;
        if (res.ok) {
            newQuote = apiUtils.convertJSONResponse(await res.json());
        } else {
            // TODO
            // const errorMessage = assetUtils.swapQuoterErrorMessage(asset, error);

            // errorReporter.report(error);
            // analytics.trackQuoteError(error.message ? error.message : 'other', baseUnitValue, fetchOrigin);

            // if (options.dispatchErrors) {
            //     dispatch(actions.setQuoteRequestStateFailure());
            //     errorFlasher.flashNewErrorMessage(dispatch, errorMessage || 'Error fetching price, please try again');
            // }
            return;
        }
        // We have a successful new swap quote
        errorFlasher.clearError(dispatch);
        // invalidate the last swap quote.
        dispatch(actions.updateLatestSwapQuote(newQuote));
        analytics.trackQuoteFetched(newQuote, fetchOrigin);
    },
};
