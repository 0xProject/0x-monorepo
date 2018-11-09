import * as _ from 'lodash';
import * as React from 'react';

import { ProgressBar, TimedProgressBar } from '../components/timed_progress_bar';

import { TimeCounter } from '../components/time_counter';
import { Container } from '../components/ui/container';
import { OrderProcessState, OrderState } from '../types';

export interface BuyOrderProgressProps {
    buyOrderState: OrderState;
}

export const BuyOrderProgress: React.StatelessComponent<BuyOrderProgressProps> = props => {
    const { buyOrderState } = props;
    let content: React.ReactNode = null;
    if (
        buyOrderState.processState === OrderProcessState.Processing ||
        buyOrderState.processState === OrderProcessState.Success ||
        buyOrderState.processState === OrderProcessState.Failure
    ) {
        const progress = buyOrderState.progress;
        const hasEnded = buyOrderState.processState !== OrderProcessState.Processing;
        const expectedTimeMs = progress.expectedEndTimeUnix - progress.startTimeUnix;
        content = (
            <React.Fragment>
                <Container marginBottom="5px">
                    <TimeCounter estimatedTimeMs={expectedTimeMs} hasEnded={hasEnded} key={progress.startTimeUnix} />
                </Container>
                <TimedProgressBar expectedTimeMs={expectedTimeMs} hasEnded={hasEnded} key={progress.startTimeUnix} />
            </React.Fragment>
        );
    } else {
        // Just show a static progress bar if we aren't processing or in an end state
        content = (
            <Container marginTop="10px">
                <ProgressBar width="0px" />
            </Container>
        );
    }
    return (
        <Container padding="20px 20px 0px 20px" width="100%">
            {content}
        </Container>
    );
};
