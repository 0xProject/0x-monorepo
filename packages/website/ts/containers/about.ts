import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { About as AboutComponent, AboutProps } from 'ts/pages/about/about';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { Translate } from 'ts/utils/translate';

interface ConnectedState {
    translate: Translate;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, _ownProps: AboutProps): ConnectedState => ({
    translate: state.translate,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const About: React.ComponentClass<AboutProps> = connect(mapStateToProps, mapDispatchToProps)(AboutComponent);
