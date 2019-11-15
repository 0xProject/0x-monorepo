import { SwapQuoter } from '@0x/asset-swapper';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { ERC20AssetAmountInput, ERC20AssetAmountInputProps } from '../components/erc20_asset_amount_input';
import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { ColorOption } from '../style/theme';
import { ERC20Asset, Omit, OrderProcessState, QuoteFetchOrigin } from '../types';
import { swapQuoteUpdater } from '../util/swap_quote_updater';

export interface SelectedERC20AssetAmountInputProps {
    fontColor?: ColorOption;
    startingFontSizePx: number;
    onSelectAssetClick?: (asset?: ERC20Asset) => void;
}

interface ConnectedState {
    swapQuoter: SwapQuoter;
    value?: BigNumber;
    asset?: ERC20Asset;
    isInputDisabled: boolean;
    numberOfAssetsAvailable?: number;
    canSelectOtherAsset: boolean;
}

interface ConnectedDispatch {
    updateSwapQuote: (
        swapQuoter: SwapQuoter,
        value?: BigNumber,
        asset?: ERC20Asset,
    ) => void;
}

type ConnectedProps = Omit<ERC20AssetAmountInputProps, keyof SelectedERC20AssetAmountInputProps>;

type FinalProps = ConnectedProps & SelectedERC20AssetAmountInputProps;

const mapStateToProps = (state: State, _ownProps: SelectedERC20AssetAmountInputProps): ConnectedState => {
    const processState = state.swapOrderState.processState;
    const isInputEnabled = processState === OrderProcessState.None || processState === OrderProcessState.Failure;
    const isInputDisabled = !isInputEnabled;
    const selectedAsset =
        state.selectedAsset !== undefined && state.selectedAsset.metaData.assetProxyId === AssetProxyId.ERC20
            ? (state.selectedAsset as ERC20Asset)
            : undefined;
    const numberOfAssetsAvailable = state.availableAssets === undefined ? undefined : state.availableAssets.length;
    const canSelectOtherAsset =
        numberOfAssetsAvailable && numberOfAssetsAvailable > 1
            ? isInputEnabled || processState === OrderProcessState.Success
            : false;

    const swapQuoter = state.providerState.swapQuoter;
    return {
        swapQuoter,
        value: state.selectedAssetUnitAmount,
        asset: selectedAsset,
        isInputDisabled,
        numberOfAssetsAvailable,
        canSelectOtherAsset,
    };
};

const debouncedUpdateSwapQuoteAsync = _.debounce(swapQuoteUpdater.updateSwapQuoteAsync.bind(swapQuoteUpdater), 200, {
    trailing: true,
}) as typeof swapQuoteUpdater.updateSwapQuoteAsync;

const mapDispatchToProps = (
    dispatch: Dispatch<Action>,
    _ownProps: SelectedERC20AssetAmountInputProps,
): ConnectedDispatch => ({
    updateSwapQuote: (swapQuoter, value, asset) => {
        // Update the input
        dispatch(actions.updateSelectedAssetAmount(value));
        // invalidate the last swap quote.
        dispatch(actions.updateLatestSwapQuote(undefined));
        // reset our swap state
        dispatch(actions.setSwapOrderStateNone());

        if (value !== undefined && value.isGreaterThan(0) && asset !== undefined) {
            // even if it's debounced, give them the illusion it's loading
            dispatch(actions.setQuoteRequestStatePending());
            // tslint:disable-next-line:no-floating-promises
            debouncedUpdateSwapQuoteAsync(swapQuoter, dispatch, asset, value, QuoteFetchOrigin.Manual, {
                setPending: true,
                dispatchErrors: true,
            });
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
            connectedDispatch.updateSwapQuote(connectedState.swapQuoter, value, asset);
        },
        isInputDisabled: connectedState.isInputDisabled,
        numberOfAssetsAvailable: connectedState.numberOfAssetsAvailable,
        canSelectOtherAsset: connectedState.canSelectOtherAsset,
    };
};

export const SelectedERC20AssetAmountInput: React.ComponentClass<SelectedERC20AssetAmountInputProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
)(ERC20AssetAmountInput);
