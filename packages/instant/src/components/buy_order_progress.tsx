import * as React from 'react';

import { TimedProgressBar } from '../components/timed_progress_bar';

import { TimeCounter } from '../components/time_counter';
import { Container } from '../components/ui';
import { OrderProcessState, OrderState } from '../types';

export interface BuyOrderProgressProps {
    buyOrderState: OrderState;
}

export const BuyOrderProgress: React.StatelessComponent<BuyOrderProgressProps> = props => {
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
