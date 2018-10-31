import * as React from 'react';

import { connect } from 'react-redux';

import { SimulatedProgressBar } from '../components/simulated_progress_bar';
import { TimedProgressBar } from '../components/timed_progress_bar';

import { TimeCounter } from '../components/time_counter';
import { Container } from '../components/ui';
import { State } from '../redux/reducer';
import { OrderProcessState, OrderState, SimulatedProgress } from '../types';

// TODO: rename this
// TODO: delete SimulatedProgressBar code and anything else remaining
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
        const ended = buyOrderState.processState !== OrderProcessState.PROCESSING;
        const expectedTimeMs = progress.expectedEndTimeUnix - progress.startTimeUnix;
        return (
            <Container padding="20px 20px 0px 20px" width="100%">
                <Container marginBottom="5px">
                    <TimeCounter estimatedTimeMs={expectedTimeMs} ended={ended} key={progress.startTimeUnix} />
                </Container>
                <TimedProgressBar expectedTimeMs={expectedTimeMs} ended={ended} key={progress.startTimeUnix} />
            </Container>
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
});
export const SelectedAssetSimulatedProgressBar = connect(mapStateToProps)(SelectedAssetSimulatedProgressComponent);
