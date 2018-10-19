import * as React from 'react';

import { connect } from 'react-redux';

import { SlidingError } from '../components/sliding_error';
import { LatestErrorDisplay, State } from '../redux/reducer';
import { errorUtil } from '../util/error';

export interface LatestErrorComponentProps {
    assetData?: string;
    latestError?: any;
    slidingDirection: 'down' | 'up';
}

export const LatestErrorComponent: React.StatelessComponent<LatestErrorComponentProps> = props => {
    if (!props.latestError) {
        return <div />;
    }
    const { icon, message } = errorUtil.errorDescription(props.latestError, props.assetData);
    return <SlidingError direction={props.slidingDirection} icon={icon} message={message} />;
};

interface ConnectedState {
    assetData?: string;
    latestError?: any;
    slidingDirection: 'down' | 'up';
}
export interface LatestErrorProps {}
const mapStateToProps = (state: State, _ownProps: LatestErrorProps): ConnectedState => ({
    assetData: state.selectedAssetData,
    latestError: state.latestError,
    slidingDirection: state.latestErrorDisplay === LatestErrorDisplay.Present ? 'up' : 'down',
});

export const LatestError = connect(mapStateToProps)(LatestErrorComponent);
