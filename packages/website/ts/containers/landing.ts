import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Landing as LandingComponent, LandingProps } from 'ts/pages/landing/landing';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { Translate } from 'ts/utils/translate';

interface ConnectedState {
    translate: Translate;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, _ownProps: LandingProps): ConnectedState => ({
    translate: state.translate,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const Landing: React.ComponentClass<LandingProps> = connect(mapStateToProps, mapDispatchToProps)(
    LandingComponent,
);
