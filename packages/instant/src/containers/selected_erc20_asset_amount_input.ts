import { AssetBuyer, AssetBuyerError, BuyQuote } from '@0x/asset-buyer';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { oc } from 'ts-optchain';

import { ERC20AssetAmountInput } from '../components/erc20_asset_amount_input';
import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { ColorOption } from '../style/theme';
import { AffiliateInfo, ERC20Asset, OrderProcessState } from '../types';
import { assetUtils } from '../util/asset';
import { BigNumberInput } from '../util/big_number_input';
import { errorFlasher } from '../util/error_flasher';

export interface SelectedERC20AssetAmountInputProps {
    fontColor?: ColorOption;
    startingFontSizePx: number;
    onSelectAssetClick?: (asset?: ERC20Asset) => void;
}

interface ConnectedState {
    assetBuyer?: AssetBuyer;
    value?: BigNumberInput;
    asset?: ERC20Asset;
    isDisabled: boolean;
    affiliateInfo?: AffiliateInfo;
}

interface ConnectedDispatch {
    updateBuyQuote: (
        assetBuyer?: AssetBuyer,
        value?: BigNumberInput,
        asset?: ERC20Asset,
        affiliateInfo?: AffiliateInfo,
    ) => void;
}

interface ConnectedProps {
    value?: BigNumberInput;
    asset?: ERC20Asset;
    onChange: (value?: BigNumberInput, asset?: ERC20Asset) => void;
    isDisabled: boolean;
}

type FinalProps = ConnectedProps & SelectedERC20AssetAmountInputProps;

const mapStateToProps = (state: State, _ownProps: SelectedERC20AssetAmountInputProps): ConnectedState => {
    const processState = state.buyOrderState.processState;
    const isEnabled = processState === OrderProcessState.NONE || processState === OrderProcessState.FAILURE;
    const isDisabled = !isEnabled;

    const selectedAsset = state.selectedAsset;
    if (_.isUndefined(selectedAsset) || selectedAsset.metaData.assetProxyId !== AssetProxyId.ERC20) {
        return {
            value: state.selectedAssetAmount,
            isDisabled,
        };
    }

    return {
        assetBuyer: state.assetBuyer,
        value: state.selectedAssetAmount,
        asset: selectedAsset as ERC20Asset,
        isDisabled,
        affiliateInfo: state.affiliateInfo,
    };
};

const updateBuyQuoteAsync = async (
    assetBuyer: AssetBuyer,
    dispatch: Dispatch<Action>,
    asset: ERC20Asset,
    assetAmount: BigNumber,
    affiliateInfo?: AffiliateInfo,
): Promise<void> => {
    // get a new buy quote.
    const baseUnitValue = Web3Wrapper.toBaseUnitAmount(assetAmount, asset.metaData.decimals);

    // mark quote as pending
    dispatch(actions.setQuoteRequestStatePending());

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

const debouncedUpdateBuyQuoteAsync = _.debounce(updateBuyQuoteAsync, 200, { trailing: true });

const mapDispatchToProps = (
    dispatch: Dispatch<Action>,
    _ownProps: SelectedERC20AssetAmountInputProps,
): ConnectedDispatch => ({
    updateBuyQuote: (assetBuyer, value, asset, affiliateInfo) => {
        // Update the input
        dispatch(actions.updateSelectedAssetAmount(value));
        // invalidate the last buy quote.
        dispatch(actions.updateLatestBuyQuote(undefined));
        // reset our buy state
        dispatch(actions.setBuyOrderStateNone());

        if (!_.isUndefined(value) && !_.isUndefined(asset) && !_.isUndefined(assetBuyer)) {
            // even if it's debounced, give them the illusion it's loading
            dispatch(actions.setQuoteRequestStatePending());
            // tslint:disable-next-line:no-floating-promises
            debouncedUpdateBuyQuoteAsync(assetBuyer, dispatch, asset, value, affiliateInfo);
        }
    },
});

const mergeProps = (
    connectedState: ConnectedState,
    connectedDispatch: ConnectedDispatch,
    ownProps: SelectedERC20AssetAmountInputProps,
): FinalProps => {
    return {
        ...ownProps,
        asset: connectedState.asset,
        value: connectedState.value,
        onChange: (value, asset) => {
            connectedDispatch.updateBuyQuote(connectedState.assetBuyer, value, asset, connectedState.affiliateInfo);
        },
        isDisabled: connectedState.isDisabled,
    };
};

export const SelectedERC20AssetAmountInput: React.ComponentClass<SelectedERC20AssetAmountInputProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
)(ERC20AssetAmountInput);
