import { AssetBuyer, AssetBuyerError, BuyQuote } from '@0x/asset-buyer';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { BuyOrderStateButtons } from '../components/buy_order_state_buttons';
import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { AccountState, AffiliateInfo, Asset, OrderProcessState, ZeroExInstantError } from '../types';
import { analytics } from '../util/analytics';
import { errorFlasher } from '../util/error_flasher';
import { etherscanUtil } from '../util/etherscan';

interface ConnectedState {
    accountAddress?: string;
    accountEthBalanceInWei?: BigNumber;
    buyQuote?: BuyQuote;
    buyOrderProcessingState: OrderProcessState;
    assetBuyer: AssetBuyer;
    web3Wrapper: Web3Wrapper;
    affiliateInfo?: AffiliateInfo;
    selectedAsset?: Asset;
    onViewTransaction: () => void;
    onSuccess?: (txHash: string) => void;
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
const mapStateToProps = (state: State, _ownProps: SelectedAssetBuyOrderStateButtons): ConnectedState => {
    const assetBuyer = state.providerState.assetBuyer;
    const web3Wrapper = state.providerState.web3Wrapper;
    const account = state.providerState.account;
    const accountAddress = account.state === AccountState.Ready ? account.address : undefined;
    const accountEthBalanceInWei = account.state === AccountState.Ready ? account.ethBalanceInWei : undefined;
    const selectedAsset = state.selectedAsset;
    return {
        accountAddress,
        accountEthBalanceInWei,
        buyOrderProcessingState: state.buyOrderState.processState,
        assetBuyer,
        web3Wrapper,
        buyQuote: state.latestBuyQuote,
        affiliateInfo: state.affiliateInfo,
        selectedAsset,
        onSuccess: state.onSuccess,
        onViewTransaction: () => {
            if (
                state.buyOrderState.processState === OrderProcessState.Processing ||
                state.buyOrderState.processState === OrderProcessState.Success ||
                state.buyOrderState.processState === OrderProcessState.Failure
            ) {
                const etherscanUrl = etherscanUtil.getEtherScanTxnAddressIfExists(
                    state.buyOrderState.txHash,
                    assetBuyer.networkId,
                );
                if (etherscanUrl) {
                    analytics.trackTransactionViewed(state.buyOrderState.processState);

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
        onBuySuccess: (buyQuote: BuyQuote, txHash: string) => {
            connectedDispatch.onBuySuccess(buyQuote, txHash);
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
