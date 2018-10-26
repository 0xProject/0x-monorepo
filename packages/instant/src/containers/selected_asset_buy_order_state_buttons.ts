import { AssetBuyer, BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { OrderProcessState, OrderState } from '../types';
import { etherscanUtil } from '../util/etherscan';

import { BuyOrderStateButtons } from '../components/buy_order_state_buttons';

interface ConnectedState {
    buyQuote?: BuyQuote;
    buyOrderProcessingState: OrderProcessState;
    assetBuyer?: AssetBuyer;
    onViewTransaction: () => void;
}

interface ConnectedDispatch {
    onAwaitingSignature: (buyQuote: BuyQuote) => void;
    onSignatureDenied: (buyQuote: BuyQuote, error: Error) => void;
    onBuyProcessing: (buyQuote: BuyQuote, txHash: string) => void;
    onBuySuccess: (buyQuote: BuyQuote, txHash: string) => void;
    onBuyFailure: (buyQuote: BuyQuote, txHash: string) => void;
    onRetry: () => void;
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
    onAwaitingSignature: (buyQuote: BuyQuote) => {
        const newOrderState: OrderState = { processState: OrderProcessState.AWAITING_SIGNATURE };
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
        dispatch(actions.setError(error));
    },
    onRetry: () => {
        dispatch(actions.resetAmount());
    },
});

export const SelectedAssetBuyOrderStateButtons: React.ComponentClass<SelectedAssetBuyOrderStateButtons> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(BuyOrderStateButtons);
