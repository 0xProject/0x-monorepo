import { MarketBuySwapQuote, SwapQuoter } from '@0x/asset-swapper';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Dispatch } from 'redux';

import { ERC20_SWAP_QUOTE_SLIPPAGE_PERCENTAGE, ERC721_SWAP_QUOTE_SLIPPAGE_PERCENTAGE } from '../constants';
import { Action, actions } from '../redux/actions';
import { Asset, QuoteFetchOrigin } from '../types';

import { analytics } from './analytics';
import { assetUtils } from './asset';
import { errorFlasher } from './error_flasher';
import { errorReporter } from './error_reporter';
import { gasPriceEstimator } from './gas_price_estimator';

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
        const wethAssetData = await swapQuoter.getEtherTokenAssetDataOrThrowAsync();
        let newSwapQuote: MarketBuySwapQuote | undefined;
        const slippagePercentage =
            asset.metaData.assetProxyId === AssetProxyId.ERC20
                ? ERC20_SWAP_QUOTE_SLIPPAGE_PERCENTAGE
                : ERC721_SWAP_QUOTE_SLIPPAGE_PERCENTAGE;
        try {
            const gasInfo = await gasPriceEstimator.getGasInfoAsync();
            newSwapQuote = await swapQuoter.getMarketBuySwapQuoteForAssetDataAsync(
                asset.assetData,
                wethAssetData,
                baseUnitValue,
                {
                    slippagePercentage,
                    gasPrice: gasInfo.gasPriceInWei,
                    // Only use native orders
                    // excludedSources: [ERC20BridgeSource.Eth2Dai, ERC20BridgeSource.Kyber, ERC20BridgeSource.Uniswap],
                },
            );
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
