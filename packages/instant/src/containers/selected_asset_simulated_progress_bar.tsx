import * as React from 'react';

import { connect } from 'react-redux';

import { SimulatedProgressBar } from '../components/simulated_progress_bar';

import { State } from '../redux/reducer';
import { OrderProcessState, OrderState, SimulatedProgress } from '../types';

interface SelectedAssetProgressComponentProps {
    buyOrderState: OrderState;
}
export const SelectedAssetSimulatedProgressComponent: React.StatelessComponent<
    SelectedAssetProgressComponentProps
> = props => {
    const { buyOrderState } = props;

    if (
        buyOrderState.processState === OrderProcessState.PROCESSING ||
        buyOrderState.processState === OrderProcessState.SUCCESS ||
        buyOrderState.processState === OrderProcessState.FAILURE
    ) {
        const progress = buyOrderState.progress;
        return (
            <SimulatedProgressBar
                startTimeUnix={progress.startTimeUnix}
                expectedEndTimeUnix={progress.expectedEndTimeUnix}
                ended={progress.ended}
            />
        );
    }

    return null;
};

interface ConnectedState {
    buyOrderState: OrderState;
    simulatedProgress?: SimulatedProgress;
}
const mapStateToProps = (state: State, _ownProps: {}): ConnectedState => ({
    buyOrderState: state.buyOrderState,
    simulatedProgress: state.simulatedProgress,
});
export const SelectedAssetSimulatedProgressBar = connect(mapStateToProps)(SelectedAssetSimulatedProgressComponent);
