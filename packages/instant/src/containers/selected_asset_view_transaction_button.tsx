import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../redux/reducer';

import { ViewTransactionButton } from '../components/view_transaction_button';
import { OrderProcessState } from '../types';
import { etherscanUtil } from '../util/etherscan';

export interface SelectedAssetViewTransactionButtonProps {
    width?: string;
}

interface ConnectedState {
    onClick: () => void;
    width?: string;
}

const mapStateToProps = (state: State, ownProps: SelectedAssetViewTransactionButtonProps): ConnectedState => ({
    onClick: () => {
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
    width: ownProps.width,
});

export const SelectedAssetViewTransactionButton: React.ComponentClass<
    SelectedAssetViewTransactionButtonProps
> = connect(mapStateToProps)(ViewTransactionButton);
