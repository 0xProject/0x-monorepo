import { AssetBuyer, AssetBuyerError, BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { BuyOrderStateButtons } from '../components/buy_order_state_buttons';
import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { AffiliateInfo, OrderProcessState, ZeroExInstantError } from '../types';
import { errorFlasher } from '../util/error_flasher';
import { etherscanUtil } from '../util/etherscan';

interface ConnectedState {
    buyQuote?: BuyQuote;
    buyOrderProcessingState: OrderProcessState;
    assetBuyer?: AssetBuyer;
    affiliateInfo?: AffiliateInfo;
    onViewTransaction: () => void;
}

interface ConnectedDispatch {
    onValidationPending: (buyQuote: BuyQuote) => void;
    onSignatureDenied: (buyQuote: BuyQuote) => void;
    onBuyProcessing: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) => void;
    onBuySuccess: (buyQuote: BuyQuote, txHash: string) => void;
    onBuyFailure: (buyQuote: BuyQuote, txHash: string) => void;
    onRetry: () => void;
    onValidationFail: (buyQuote: BuyQuote, errorMessage: AssetBuyerError | ZeroExInstantError) => void;
}
export interface SelectedAssetBuyOrderStateButtons {}
const mapStateToProps = (state: State, _ownProps: SelectedAssetBuyOrderStateButtons): ConnectedState => ({
    buyOrderProcessingState: state.buyOrderState.processState,
    assetBuyer: state.assetBuyer,
    buyQuote: state.latestBuyQuote,
    affiliateInfo: state.affiliateInfo,
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
        dispatch(actions.setBuyOrderStateValidating());
    },
    onBuyProcessing: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) => {
        dispatch(actions.setBuyOrderStateProcessing(txHash, startTimeUnix, expectedEndTimeUnix));
    },
    onBuySuccess: (buyQuote: BuyQuote, txHash: string) => dispatch(actions.setBuyOrderStateSuccess(txHash)),
    onBuyFailure: (buyQuote: BuyQuote, txHash: string) => dispatch(actions.setBuyOrderStateFailure(txHash)),
    onSignatureDenied: () => {
        dispatch(actions.resetAmount());
        const errorMessage = 'You denied this transaction';
        errorFlasher.flashNewErrorMessage(dispatch, errorMessage);
    },
    onValidationFail: (buyQuote, error) => {
        dispatch(actions.setBuyOrderStateNone());
        if (error === ZeroExInstantError.InsufficientETH) {
            const errorMessage = "You don't have enough ETH";
            errorFlasher.flashNewErrorMessage(dispatch, errorMessage);
        } else {
            errorFlasher.flashNewErrorMessage(dispatch);
        }
    },
    onRetry: () => {
        dispatch(actions.resetAmount());
    },
});

export const SelectedAssetBuyOrderStateButtons: React.ComponentClass<SelectedAssetBuyOrderStateButtons> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(BuyOrderStateButtons);
