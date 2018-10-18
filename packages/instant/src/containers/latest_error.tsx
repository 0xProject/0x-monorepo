import * as React from 'react';

import { connect } from 'react-redux';

import { SlidingError } from '../components/sliding_error';
import { LatestErrorDisplay, State } from '../redux/reducer';
import { Asset } from '../types';
import { errorUtil } from '../util/error';

export interface LatestErrorComponentProps {
    asset?: Asset;
    latestError?: any;
    slidingDirection: 'down' | 'up';
}

export const LatestErrorComponent: React.StatelessComponent<LatestErrorComponentProps> = props => {
    if (!props.latestError) {
        return <div />;
    }
    const { icon, message } = errorUtil.errorDescription(props.latestError, props.asset);
    return <SlidingError direction={props.slidingDirection} icon={icon} message={message} />;
};

interface ConnectedState {
    asset?: Asset;
    latestError?: any;
    slidingDirection: 'down' | 'up';
}
export interface LatestErrorProps {}
const mapStateToProps = (state: State, _ownProps: LatestErrorProps): ConnectedState => ({
    asset: state.selectedAsset,
    latestError: state.latestError,
    slidingDirection: state.latestErrorDisplay === LatestErrorDisplay.Present ? 'up' : 'down',
});

export const LatestError = connect(mapStateToProps)(LatestErrorComponent);
