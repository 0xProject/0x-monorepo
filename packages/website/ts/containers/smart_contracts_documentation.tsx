import * as _ from 'lodash';
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch, Store as ReduxStore} from 'redux';
import {
    SmartContractsDocumentation as SmartContractsDocumentationComponent,
    SmartContractsDocumentationAllProps,
} from 'ts/pages/documentation/smart_contracts_documentation';
import {Dispatcher} from 'ts/redux/dispatcher';
import {State} from 'ts/redux/reducer';

interface ConnectedState {
    docsVersion: string;
    availableDocVersions: string[];
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, ownProps: SmartContractsDocumentationAllProps): ConnectedState => ({
    docsVersion: state.docsVersion,
    availableDocVersions: state.availableDocVersions,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const SmartContractsDocumentation: React.ComponentClass<SmartContractsDocumentationAllProps> =
  connect(mapStateToProps, mapDispatchToProps)(SmartContractsDocumentationComponent);
