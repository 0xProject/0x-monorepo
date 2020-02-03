import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { BuyOrderStateButtons } from '../components/buy_order_state_buttons';
import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { AccountState, AffiliateInfo, Asset, OrderProcessState, ZeroExAPIQuoteResponse, ZeroExInstantError } from '../types';
import { analytics } from '../util/analytics';
import { errorFlasher } from '../util/error_flasher';
import { etherscanUtil } from '../util/etherscan';

interface ConnectedState {
    accountAddress?: string;
    accountEthBalanceInWei?: BigNumber;
    quote?: ZeroExAPIQuoteResponse;
    swapOrderProcessingState: OrderProcessState;
    web3Wrapper: Web3Wrapper;
    affiliateInfo?: AffiliateInfo;
    selectedAsset?: Asset;
    onViewTransaction: () => void;
    onSuccess?: (txHash: string) => void;
}

// TODO(dave4506) expand errors and failures to be richer + other errors introducted in v3 of the protocol
interface ConnectedDispatch {
    onValidationPending: (quote: ZeroExAPIQuoteResponse) => void;
    onSignatureDenied: (quote: ZeroExAPIQuoteResponse) => void;
    onBuyProcessing: (
        quote: ZeroExAPIQuoteResponse,
        txHash: string,
        startTimeUnix: number,
        expectedEndTimeUnix: number,
    ) => void;
    onBuySuccess: (quote: ZeroExAPIQuoteResponse, txHash: string) => void;
    onBuyFailure: (quote: ZeroExAPIQuoteResponse, txHash: string) => void;
    onRetry: () => void;
    onValidationFail: (
        swapQuote: ZeroExAPIQuoteResponse,
        errorMessage: ZeroExInstantError, // TODO
    ) => void;
}
export interface SelectedAssetBuyOrderStateButtons {}
const mapStateToProps = (state: State, _ownProps: SelectedAssetBuyOrderStateButtons): ConnectedState => {
    const web3Wrapper = state.providerState.web3Wrapper;
    const chainId = state.network;
    const account = state.providerState.account;
    const accountAddress = account.state === AccountState.Ready ? account.address : undefined;
    const accountEthBalanceInWei = account.state === AccountState.Ready ? account.ethBalanceInWei : undefined;
    const selectedAsset = state.selectedAsset;
    return {
        accountAddress,
        accountEthBalanceInWei,
        swapOrderProcessingState: state.swapOrderState.processState,
        web3Wrapper,
        quote: state.latestQuote,
        affiliateInfo: state.affiliateInfo,
        selectedAsset,
        onSuccess: state.onSuccess,
        onViewTransaction: () => {
            if (
                state.swapOrderState.processState === OrderProcessState.Processing ||
                state.swapOrderState.processState === OrderProcessState.Success ||
                state.swapOrderState.processState === OrderProcessState.Failure
            ) {
                const etherscanUrl = etherscanUtil.getEtherScanTxnAddressIfExists(state.swapOrderState.txHash, chainId);
                if (etherscanUrl) {
                    analytics.trackTransactionViewed(state.swapOrderState.processState);

                    window.open(etherscanUrl, '_blank');
                    return;
                }
            }
        },
    };
};

const mapDispatchToProps = (
    dispatch: Dispatch<Action>,
    ownProps: SelectedAssetBuyOrderStateButtons,
): ConnectedDispatch => ({
    onValidationPending: (quote: ZeroExAPIQuoteResponse) => {
        dispatch(actions.setSwapOrderStateValidating());
    },
    onBuyProcessing: (
        quote: ZeroExAPIQuoteResponse,
        txHash: string,
        startTimeUnix: number,
        expectedEndTimeUnix: number,
    ) => {
        dispatch(actions.setSwapOrderStateProcessing(txHash, startTimeUnix, expectedEndTimeUnix));
    },
    onBuySuccess: (quote: ZeroExAPIQuoteResponse, txHash: string) => dispatch(actions.setSwapOrderStateSuccess(txHash)),
    onBuyFailure: (quote: ZeroExAPIQuoteResponse, txHash: string) => dispatch(actions.setSwapOrderStateFailure(txHash)),
    onSignatureDenied: () => {
        dispatch(actions.resetAmount());
        const errorMessage = 'You denied this transaction';
        errorFlasher.flashNewErrorMessage(dispatch, errorMessage);
    },
    onValidationFail: (swapQuote, error) => {
        dispatch(actions.setSwapOrderStateNone());
        if (error === ZeroExInstantError.InsufficientETH) {
            const errorMessage = "You don't have enough ETH";
            errorFlasher.flashNewErrorMessage(dispatch, errorMessage);
        } else if (error === ZeroExInstantError.CouldNotSubmitTransaction) {
            const errorMessage = 'Could not submit transaction';
            errorFlasher.flashNewErrorMessage(dispatch, errorMessage);
        } else {
            errorFlasher.flashNewErrorMessage(dispatch);
        }
    },
    onRetry: () => {
        dispatch(actions.resetAmount());
    },
});

const mergeProps = (
    connectedState: ConnectedState,
    connectedDispatch: ConnectedDispatch,
    ownProps: SelectedAssetBuyOrderStateButtons,
) => {
    return {
        ...ownProps,
        ...connectedState,
        ...connectedDispatch,
        onBuySuccess: (quote: ZeroExAPIQuoteResponse, txHash: string) => {
            connectedDispatch.onBuySuccess(quote, txHash);
            if (connectedState.onSuccess) {
                connectedState.onSuccess(txHash);
            }
        },
    };
};

export const SelectedAssetBuyOrderStateButtons = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
)(BuyOrderStateButtons);
