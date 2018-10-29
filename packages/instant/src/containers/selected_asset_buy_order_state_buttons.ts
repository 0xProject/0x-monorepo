import { AssetBuyer, BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { OrderProcessState, OrderState, ZeroExInstantError } from '../types';
import { etherscanUtil } from '../util/etherscan';

import { BuyOrderStateButtons } from '../components/buy_order_state_buttons';
import { errorUtil } from '../util/error';

interface ConnectedState {
    buyQuote?: BuyQuote;
    buyOrderProcessingState: OrderProcessState;
    assetBuyer?: AssetBuyer;
    onViewTransaction: () => void;
}

interface ConnectedDispatch {
    onValidationPending: (buyQuote: BuyQuote) => void;
    onSignatureDenied: (buyQuote: BuyQuote, error: Error) => void;
    onBuyProcessing: (buyQuote: BuyQuote, txHash: string) => void;
    onBuySuccess: (buyQuote: BuyQuote, txHash: string) => void;
    onBuyFailure: (buyQuote: BuyQuote, txHash: string) => void;
    onRetry: () => void;
    onValidationFail: (buyQuote: BuyQuote, error: ZeroExInstantError) => void;
}
export interface SelectedAssetBuyOrderStateButtons {}
const mapStateToProps = (state: State, _ownProps: SelectedAssetBuyOrderStateButtons): ConnectedState => ({
    buyOrderProcessingState: state.buyOrderState.processState,
    assetBuyer: state.assetBuyer,
    buyQuote: state.latestBuyQuote,
    onViewTransaction: () => {
        if (
            state.assetBuyer &&
            (state.buyOrderState.processState === OrderProcessState.PROCESSING ||
                state.buyOrderState.processState === OrderProcessState.SUCCESS ||
                state.buyOrderState.processState === OrderProcessState.FAILURE)
        ) {
            const etherscanUrl = etherscanUtil.getEtherScanTxnAddressIfExists(
                state.buyOrderState.txHash,
                state.assetBuyer.networkId,
            );
            if (etherscanUrl) {
                window.open(etherscanUrl, '_blank');
                return;
            }
        }
    },
});

const mapDispatchToProps = (
    dispatch: Dispatch<Action>,
    ownProps: SelectedAssetBuyOrderStateButtons,
): ConnectedDispatch => ({
    onValidationPending: (buyQuote: BuyQuote) => {
        const newOrderState: OrderState = { processState: OrderProcessState.VALIDATING };
        dispatch(actions.updateBuyOrderState(newOrderState));
    },
    onBuyProcessing: (buyQuote: BuyQuote, txHash: string) => {
        const newOrderState: OrderState = { processState: OrderProcessState.PROCESSING, txHash };
        dispatch(actions.updateBuyOrderState(newOrderState));
    },
    onBuySuccess: (buyQuote: BuyQuote, txHash: string) =>
        dispatch(actions.updateBuyOrderState({ processState: OrderProcessState.SUCCESS, txHash })),
    onBuyFailure: (buyQuote: BuyQuote, txHash: string) =>
        dispatch(actions.updateBuyOrderState({ processState: OrderProcessState.FAILURE, txHash })),
    onSignatureDenied: (buyQuote, error) => {
        dispatch(actions.resetAmount());
        errorUtil.errorFlasher.flashNewError(dispatch, error);
    },
    onValidationFail: (buyQuote, error) => {
        dispatch(actions.updateBuyOrderState({ processState: OrderProcessState.NONE }));
        errorUtil.errorFlasher.flashNewError(dispatch, new Error(error));
    },
    onRetry: () => {
        dispatch(actions.resetAmount());
    },
});

export const SelectedAssetBuyOrderStateButtons: React.ComponentClass<SelectedAssetBuyOrderStateButtons> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(BuyOrderStateButtons);
