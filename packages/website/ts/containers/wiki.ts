import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Wiki as WikiComponent, WikiProps } from 'ts/pages/wiki/wiki';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { ScreenWidths } from 'ts/types';
import { Translate } from 'ts/utils/translate';

interface ConnectedState {
    translate: Translate;
    screenWidth: ScreenWidths;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, _ownProps: WikiProps): ConnectedState => ({
    translate: state.translate,
    screenWidth: state.screenWidth,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const Wiki: React.ComponentClass<WikiProps> = connect(mapStateToProps, mapDispatchToProps)(WikiComponent);
