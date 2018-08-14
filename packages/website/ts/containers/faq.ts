import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { FAQ as FAQComponent, FAQProps } from 'ts/pages/faq/faq';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { Translate } from 'ts/utils/translate';

interface ConnectedState {
    translate: Translate;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, _ownProps: FAQProps): ConnectedState => ({
    translate: state.translate,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const FAQ: React.ComponentClass<FAQProps> = connect(mapStateToProps, mapDispatchToProps)(FAQComponent);
