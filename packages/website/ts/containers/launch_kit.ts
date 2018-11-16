import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { LaunchKit as LaunchKitComponent, LaunchKitProps } from 'ts/pages/launch_kit/launch_kit';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { Translate } from 'ts/utils/translate';

interface ConnectedState {
    translate: Translate;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, _ownProps: LaunchKitProps): ConnectedState => ({
    translate: state.translate,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const LaunchKit: React.ComponentClass<LaunchKitProps> = connect(mapStateToProps, mapDispatchToProps)(
    LaunchKitComponent,
);
