import * as React from 'react';

import { connect } from 'react-redux';

import { SlideAnimationState } from '../components/animations/slide_animation';
import { SlidingError } from '../components/sliding_error';
import { State } from '../redux/reducer';
import { Asset, DisplayStatus } from '../types';

export interface LatestErrorComponentProps {
    asset?: Asset;
    latestErrorMessage?: string;
    animationState: SlideAnimationState;
}

export const LatestErrorComponent: React.StatelessComponent<LatestErrorComponentProps> = props => {
    if (!props.latestErrorMessage) {
        return <div />;
    }
    return <SlidingError animationState={props.animationState} icon="😢" message={props.latestErrorMessage} />;
};

interface ConnectedState {
    asset?: Asset;
    latestErrorMessage?: string;
    animationState: SlideAnimationState;
}
export interface LatestErrorProps {}
const mapStateToProps = (state: State, _ownProps: LatestErrorProps): ConnectedState => ({
    asset: state.selectedAsset,
    latestErrorMessage: state.latestErrorMessage,
    animationState: state.latestErrorDisplayStatus === DisplayStatus.Present ? 'slidIn' : 'slidOut',
});

export const LatestError = connect(mapStateToProps)(LatestErrorComponent);
