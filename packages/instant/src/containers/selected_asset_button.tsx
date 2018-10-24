import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';

import { SecondaryButton } from '../components/secondary_button';
import { State } from '../redux/reducer';
import { AsyncProcessState, OrderState } from '../types';

import { PlacingOrderButton } from '../components/placing_order_button';

import { SelectedAssetBuyButton } from './selected_asset_buy_button';
import { SelectedAssetRetryButton } from './selected_asset_retry_button';
import { SelectedAssetViewTransactionButton } from './selected_asset_view_transaction_button';

interface ConnectedState {
    buyOrderState: OrderState;
}
export interface SelectedAssetButtonProps {}
const mapStateToProps = (state: State, _ownProps: SelectedAssetButtonProps): ConnectedState => ({
    buyOrderState: state.buyOrderState,
});

const SelectedAssetButtonPresentationComponent: React.StatelessComponent<{
    buyOrderState: OrderState;
}> = props => {
    if (props.buyOrderState.processState === AsyncProcessState.FAILURE) {
        return <SelectedAssetRetryButton />;
    } else if (props.buyOrderState.processState === AsyncProcessState.SUCCESS) {
        return <SelectedAssetViewTransactionButton />;
    } else if (props.buyOrderState.processState === AsyncProcessState.PENDING) {
        return <PlacingOrderButton />;
    }

    return <SelectedAssetBuyButton />;
};

export const SelectedAssetButton: React.ComponentClass<SelectedAssetButtonProps> = connect(mapStateToProps)(
    SelectedAssetButtonPresentationComponent,
);
