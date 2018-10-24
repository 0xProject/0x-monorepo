import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../redux/reducer';
import { AsyncProcessState } from '../types';

import { BuyOrderStateButton } from '../components/buy_order_state_button';

interface ConnectedState {
    buyOrderState: AsyncProcessState;
}
export interface SelectedAssetButtonProps {}
const mapStateToProps = (state: State, _ownProps: SelectedAssetButtonProps): ConnectedState => ({
    buyOrderState: state.buyOrderState,
});

export const SelectedAssetBuyOrderStateButton: React.ComponentClass<SelectedAssetButtonProps> = connect(
    mapStateToProps,
)(BuyOrderStateButton);
