import * as React from 'react';

import { connect } from 'react-redux';

import { SlidingError } from '../components/sliding_error';
import { State } from '../redux/reducer';
import { Asset, DisplayStatus } from '../types';

export interface LatestErrorComponentProps {
    asset?: Asset;
    latestErrorMessage?: string;
    slidingDirection: 'down' | 'up';
}

export const LatestErrorComponent: React.StatelessComponent<LatestErrorComponentProps> = props => {
    if (!props.latestErrorMessage) {
        return <div />;
    }
    return <SlidingError direction={props.slidingDirection} icon="😢" message={props.latestErrorMessage} />;
};

interface ConnectedState {
    asset?: Asset;
    latestErrorMessage?: string;
    slidingDirection: 'down' | 'up';
}
export interface LatestErrorProps {}
const mapStateToProps = (state: State, _ownProps: LatestErrorProps): ConnectedState => ({
    asset: state.selectedAsset,
    latestErrorMessage: state.latestErrorMessage,
    slidingDirection: state.latestErrorDisplayStatus === DisplayStatus.Present ? 'up' : 'down',
});

export const LatestError = connect(mapStateToProps)(LatestErrorComponent);
