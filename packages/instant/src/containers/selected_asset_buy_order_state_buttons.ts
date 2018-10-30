import { AssetBuyer, AssetBuyerError, BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { BuyOrderStateButtons } from '../components/buy_order_state_buttons';
import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { OrderProcessState, OrderState, ZeroExInstantError } from '../types';
import { errorFlasher } from '../util/error_flasher';
import { etherscanUtil } from '../util/etherscan';

interface ConnectedState {
    buyQuote?: BuyQuote;
    buyOrderProcessingState: OrderProcessState;
    assetBuyer?: AssetBuyer;
    onViewTransaction: () => void;
}

interface ConnectedDispatch {
    onValidationPending: (buyQuote: BuyQuote) => void;
    onSignatureDenied: (buyQuote: BuyQuote) => void;
    onBuyProcessing: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) => void;
    onBuySuccess: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) => void;
    onBuyFailure: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) => void;
    onRetry: () => void;
    onValidationFail: (buyQuote: BuyQuote, errorMessage: AssetBuyerError | ZeroExInstantError) => void;
    secondaryProgressDemo: () => void;
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
    onBuyProcessing: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) => {
        const newOrderState: OrderState = {
            processState: OrderProcessState.PROCESSING,
            txHash,
            progress: {
                startTimeUnix,
                expectedEndTimeUnix,
                ended: false,
            },
        };
        dispatch(actions.updateBuyOrderState(newOrderState));
    },
    onBuySuccess: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) =>
        dispatch(
            actions.updateBuyOrderState({
                processState: OrderProcessState.SUCCESS,
                txHash,
                progress: {
                    startTimeUnix,
                    expectedEndTimeUnix,
                    ended: true,
                },
            }),
        ),
    onBuyFailure: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) =>
        dispatch(
            actions.updateBuyOrderState({
                processState: OrderProcessState.FAILURE,
                txHash,
                progress: {
                    startTimeUnix,
                    expectedEndTimeUnix,
                    ended: true,
                },
            }),
        ),
    onSignatureDenied: () => {
        dispatch(actions.resetAmount());
        const errorMessage = 'You denied this transaction';
        errorFlasher.flashNewErrorMessage(dispatch, errorMessage);
    },
    onValidationFail: (buyQuote, error) => {
        dispatch(actions.updateBuyOrderState({ processState: OrderProcessState.NONE }));
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
    secondaryProgressDemo: () => {
        const nowTime = new Date().getTime();
        const futureTime = nowTime + 5000;
        dispatch(
            actions.updateSimulatedOrderProgress({
                startTimeUnix: nowTime,
                expectedEndTimeUnix: futureTime,
                ended: false,
            }),
        );

        window.setTimeout(() => {
            console.log('simulate finishing');

            dispatch(
                actions.updateSimulatedOrderProgress({
                    startTimeUnix: nowTime,
                    expectedEndTimeUnix: futureTime,
                    ended: true,
                }),
            );
        }, 2000);
    },
});

export const SelectedAssetBuyOrderStateButtons: React.ComponentClass<SelectedAssetBuyOrderStateButtons> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(BuyOrderStateButtons);
