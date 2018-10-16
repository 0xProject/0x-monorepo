import * as React from 'react';

import { connect } from 'react-redux';

import { SlidingError } from '../components/sliding_error';
import { State } from '../redux/reducer';
import { errorDescription } from '../util/error_description';

export interface LatestErrorComponentProps {
    assetData?: string;
    latestError?: any;
    latestErrorDismissed?: boolean;
}

export const LatestErrorComponent: React.StatelessComponent<LatestErrorComponentProps> = props => {
    if (!props.latestError) {
        return <div />;
    }
    const slidingDirection = props.latestErrorDismissed ? 'down' : 'up';
    const { icon, message } = errorDescription(props.latestError, props.assetData);
    return <SlidingError direction={slidingDirection} icon={icon} message={message} />;
};

interface ConnectedState {
    assetData?: string;
    latestError?: any;
    latestErrorDismissed?: boolean;
}
export interface LatestErrorProps {}
const mapStateToProps = (state: State, _ownProps: LatestErrorProps): ConnectedState => ({
    assetData: state.selectedAssetData,
    latestError: state.latestError,
    latestErrorDismissed: state.latestErrorDismissed,
});

export const LatestError = connect(mapStateToProps)(LatestErrorComponent);
