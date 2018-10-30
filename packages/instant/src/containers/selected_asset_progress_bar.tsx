import * as React from 'react';

import { connect } from 'react-redux';

import { ProgressBar } from '../components/progress_bar';
import { State } from '../redux/reducer';
import { OrderProcessState, OrderState } from '../types';

interface SelectedAssetProgressComponentProps {
    buyOrderState: OrderState;
    percentageDone?: number;
}
export const SelectedAssetProgressComponent: React.StatelessComponent<SelectedAssetProgressComponentProps> = props => {
    const { buyOrderState, percentageDone } = props;

    // TODO: uncomment after done testing
    // const isOrderStateOk =
    //     buyOrderState.processState === OrderProcessState.PROCESSING ||
    //     buyOrderState.processState === OrderProcessState.SUCCESS;
    const isOrderStateOk = true;

    if (isOrderStateOk && percentageDone) {
        return <ProgressBar percentageDone={percentageDone} estTimeMs={1000} elapsedTimeMs={2000} />;
    }

    return null;
};

interface ConnectedState {
    buyOrderState: OrderState;
    percentageDone?: number;
}
const mapStateToProps = (state: State, _ownProps: {}): ConnectedState => ({
    buyOrderState: state.buyOrderState,
    percentageDone: state.orderProgress && state.orderProgress.percentageDone,
});
export const SelectedAssetProgressBar = connect(mapStateToProps)(SelectedAssetProgressComponent);
