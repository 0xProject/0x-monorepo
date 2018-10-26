import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../redux/reducer';
import { OrderProcessState } from '../types';

import { BuyOrderStateButton } from '../components/buy_order_state_button';

interface ConnectedState {
    buyOrderProcessingState: OrderProcessState;
}
export interface SelectedAssetButtonProps {}
const mapStateToProps = (state: State, _ownProps: SelectedAssetButtonProps): ConnectedState => ({
    buyOrderProcessingState: state.buyOrderState.processState,
});

export const SelectedAssetBuyOrderStateButton: React.ComponentClass<SelectedAssetButtonProps> = connect(
    mapStateToProps,
)(BuyOrderStateButton);
