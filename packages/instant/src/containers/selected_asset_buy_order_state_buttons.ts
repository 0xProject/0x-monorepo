import { MarketBuySwapQuote, SwapQuoteConsumer, SwapQuoteConsumerError, SwapQuoter } from '@0x/asset-swapper';
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
    swapQuote?: MarketBuySwapQuote;
    swapOrderProcessingState: OrderProcessState;
    swapQuoter: SwapQuoter;
    swapQuoteConsumer: SwapQuoteConsumer;
    web3Wrapper: Web3Wrapper;
    affiliateInfo?: AffiliateInfo;
    selectedAsset?: Asset;
    onViewTransaction: () => void;
    onSuccess?: (txHash: string) => void;
}

// TODO(dave4506) expand errors and failures to be richer + other errors introducted in v3 of the protocol
interface ConnectedDispatch {
    onValidationPending: (swapQuote: MarketBuySwapQuote) => void;
    onSignatureDenied: (swapQuote: MarketBuySwapQuote) => void;
    onBuyProcessing: (
        swapQuote: MarketBuySwapQuote,
        txHash: string,
        startTimeUnix: number,
        expectedEndTimeUnix: number,
    ) => void;
    onBuySuccess: (swapQuote: MarketBuySwapQuote, txHash: string) => void;
    onBuyFailure: (swapQuote: MarketBuySwapQuote, txHash: string) => void;
    onRetry: () => void;
    onValidationFail: (
        swapQuote: MarketBuySwapQuote,
        errorMessage: SwapQuoteConsumerError | ZeroExInstantError,
    ) => void;
}
export interface SelectedAssetBuyOrderStateButtons {}
const mapStateToProps = (state: State, _ownProps: SelectedAssetBuyOrderStateButtons): ConnectedState => {
    const swapQuoter = state.providerState.swapQuoter;
    const swapQuoteConsumer = state.providerState.swapQuoteConsumer;
    const chainId = swapQuoteConsumer.chainId;
    const web3Wrapper = state.providerState.web3Wrapper;
    const account = state.providerState.account;
    const accountAddress = account.state === AccountState.Ready ? account.address : undefined;
    const accountEthBalanceInWei = account.state === AccountState.Ready ? account.ethBalanceInWei : undefined;
    const selectedAsset = state.selectedAsset;
    return {
        accountAddress,
        accountEthBalanceInWei,
        swapOrderProcessingState: state.swapOrderState.processState,
        swapQuoter,
        swapQuoteConsumer,
        web3Wrapper,
        swapQuote: state.latestSwapQuote,
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
    onValidationPending: (swapQuote: MarketBuySwapQuote) => {
        dispatch(actions.setSwapOrderStateValidating());
    },
    onBuyProcessing: (
        swapQuote: MarketBuySwapQuote,
        txHash: string,
        startTimeUnix: number,
        expectedEndTimeUnix: number,
    ) => {
        dispatch(actions.setSwapOrderStateProcessing(txHash, startTimeUnix, expectedEndTimeUnix));
    },
    onBuySuccess: (swapQuote: MarketBuySwapQuote, txHash: string) => dispatch(actions.setSwapOrderStateSuccess(txHash)),
    onBuyFailure: (swapQuote: MarketBuySwapQuote, txHash: string) => dispatch(actions.setSwapOrderStateFailure(txHash)),
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
        onBuySuccess: (swapQuote: MarketBuySwapQuote, txHash: string) => {
            connectedDispatch.onBuySuccess(swapQuote, txHash);
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
