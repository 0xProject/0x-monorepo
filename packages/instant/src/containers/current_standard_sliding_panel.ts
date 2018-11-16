import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { StandardSlidingPanel } from '../components/standard_sliding_panel';
import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { StandardSlidingPanelSettings } from '../types';

export interface CurrentStandardSlidingPanelProps {}

interface ConnectedState extends StandardSlidingPanelSettings {}

interface ConnectedDispatch {
    onClose: () => void;
}

const mapStateToProps = (state: State, _ownProps: CurrentStandardSlidingPanelProps): ConnectedState =>
    state.standardSlidingPanelSettings;

const mapDispatchToProps = (
    dispatch: Dispatch<Action>,
    ownProps: CurrentStandardSlidingPanelProps,
): ConnectedDispatch => ({
    onClose: () => dispatch(actions.closeStandardSlidingPanel()),
});

export const CurrentStandardSlidingPanel: React.ComponentClass<CurrentStandardSlidingPanelProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(StandardSlidingPanel);
