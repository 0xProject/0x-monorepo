import { connect } from 'react-redux';

import { BuyOrderProgress } from '../components/buy_order_progress';
import { State } from '../redux/reducer';
import { OrderState } from '../types';

interface ConnectedState {
    swapOrderState: OrderState;
}
const mapStateToProps = (state: State, _ownProps: {}): ConnectedState => ({
    swapOrderState: state.swapOrderState,
});
export const SelectedAssetBuyOrderProgress = connect(mapStateToProps)(BuyOrderProgress);
