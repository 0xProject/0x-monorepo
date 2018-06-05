import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Wiki as WikiComponent, WikiProps } from 'ts/pages/wiki/wiki';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { Translate } from 'ts/utils/translate';

interface ConnectedState {
    translate: Translate;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, ownProps: WikiProps): ConnectedState => ({
    translate: state.translate,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const Wiki: React.ComponentClass<WikiProps> = connect(mapStateToProps, mapDispatchToProps)(WikiComponent);
