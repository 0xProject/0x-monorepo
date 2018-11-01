import * as React from 'react';

import { connect } from 'react-redux';

import { TimedProgressBar } from '../components/timed_progress_bar';

import { TimeCounter } from '../components/time_counter';
import { Container } from '../components/ui';
import { State } from '../redux/reducer';
import { OrderProcessState, OrderState, SimulatedProgress } from '../types';

interface SelectedAssetProgressComponentProps {
    buyOrderState: OrderState;
}
// TODO: rename this component and move to seperate file, and get props using mapStateToProps
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
        const hasEnded = buyOrderState.processState !== OrderProcessState.PROCESSING;
        const expectedTimeMs = progress.expectedEndTimeUnix - progress.startTimeUnix;
        return (
            <Container padding="20px 20px 0px 20px" width="100%">
                <Container marginBottom="5px">
                    <TimeCounter estimatedTimeMs={expectedTimeMs} hasEnded={hasEnded} key={progress.startTimeUnix} />
                </Container>
                <TimedProgressBar expectedTimeMs={expectedTimeMs} hasEnded={hasEnded} key={progress.startTimeUnix} />
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
export const SelectedAssetProgress = connect(mapStateToProps)(SelectedAssetSimulatedProgressComponent);
