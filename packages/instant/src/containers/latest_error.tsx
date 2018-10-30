import * as React from 'react';

import { connect } from 'react-redux';

import { SlideAnimationPhase } from '../components/animations/slide_animations';
import { SlidingError } from '../components/sliding_error';
import { State } from '../redux/reducer';
import { Asset, DisplayStatus } from '../types';

export interface LatestErrorComponentProps {
    asset?: Asset;
    latestErrorMessage?: string;
    slidingPhase: SlideAnimationPhase;
}

export const LatestErrorComponent: React.StatelessComponent<LatestErrorComponentProps> = props => {
    if (!props.latestErrorMessage) {
        return <div />;
    }
    return <SlidingError phase={props.slidingPhase} icon="😢" message={props.latestErrorMessage} />;
};

interface ConnectedState {
    asset?: Asset;
    latestErrorMessage?: string;
    slidingPhase: SlideAnimationPhase;
}
export interface LatestErrorProps {}
const mapStateToProps = (state: State, _ownProps: LatestErrorProps): ConnectedState => ({
    asset: state.selectedAsset,
    latestErrorMessage: state.latestErrorMessage,
    slidingPhase: state.latestErrorDisplayStatus === DisplayStatus.Present ? 'slideIn' : 'slideOut',
});

export const LatestError = connect(mapStateToProps)(LatestErrorComponent);
