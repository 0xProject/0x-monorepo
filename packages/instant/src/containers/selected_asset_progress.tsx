// TODO: rename file and props to SelectedAssetBuyOrderProgress and use .ts

import { connect } from 'react-redux';

import { BuyOrderProgress } from '../components/buy_order_progress';
import { State } from '../redux/reducer';
import { OrderState } from '../types';

interface ConnectedState {
    buyOrderState: OrderState;
}
const mapStateToProps = (state: State, _ownProps: {}): ConnectedState => ({
    buyOrderState: state.buyOrderState,
});
export const SelectedAssetProgress = connect(mapStateToProps)(BuyOrderProgress);
