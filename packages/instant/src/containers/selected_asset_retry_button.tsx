import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Action, actions } from '../redux/actions';

import { RetryButton } from '../components/retry_button';

export interface SelectedAssetRetryButtonProps {}

interface ConnectedDispatch {
    onClick: () => void;
}

const mapDispatchToProps = (
    dispatch: Dispatch<Action>,
    _ownProps: SelectedAssetRetryButtonProps,
): ConnectedDispatch => ({
    onClick: () => dispatch(actions.resetAmount()),
});

export const SelectedAssetRetryButton: React.ComponentClass<SelectedAssetRetryButtonProps> = connect(
    undefined,
    mapDispatchToProps,
)(RetryButton);
