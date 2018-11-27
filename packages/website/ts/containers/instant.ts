import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Instant as InstantComponent, InstantProps } from 'ts/pages/instant/instant';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { Translate } from 'ts/utils/translate';

interface ConnectedState {
    translate: Translate;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, _ownProps: InstantProps): ConnectedState => ({
    translate: state.translate,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const Instant: React.ComponentClass<InstantProps> = connect(mapStateToProps, mapDispatchToProps)(
    InstantComponent,
);
