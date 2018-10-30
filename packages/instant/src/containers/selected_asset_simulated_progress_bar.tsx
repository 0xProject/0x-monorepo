import * as React from 'react';

import { connect } from 'react-redux';

import { SimulatedProgressBar } from '../components/simulated_progress_bar';

import { State } from '../redux/reducer';
import { OrderProcessState, OrderState, SimulatedProgress } from '../types';

interface SelectedAssetProgressComponentProps {
    buyOrderState: OrderState;
    simulatedProgress?: SimulatedProgress;
}
export const SelectedAssetSimulatedProgressComponent: React.StatelessComponent<
    SelectedAssetProgressComponentProps
> = props => {
    const { buyOrderState, simulatedProgress } = props;

    console.log('simulatedProgress', simulatedProgress);

    // TODO: uncomment after done testing
    // const isOrderStateOk =
    //     buyOrderState.processState === OrderProcessState.PROCESSING ||
    //     buyOrderState.processState === OrderProcessState.SUCCESS;
    const isOrderStateOk = true;

    if (isOrderStateOk && simulatedProgress) {
        return (
            <SimulatedProgressBar
                startTimeUnix={simulatedProgress.startTimeUnix}
                expectedEndTimeUnix={simulatedProgress.expectedEndTimeUnix}
                ended={simulatedProgress.ended}
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
