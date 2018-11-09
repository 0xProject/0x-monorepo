import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../redux/reducer';
import { OrderProcessState } from '../types';

import { ZeroExInstantContainer } from '../components/zero_ex_instant_container';

export interface ConnectedZeroExInstantContainerProps {}

interface ConnectedState {
    orderProcessState: OrderProcessState;
}

const mapStateToProps = (state: State, _ownProps: ConnectedZeroExInstantContainerProps): ConnectedState => ({
    orderProcessState: state.buyOrderState.processState,
});

export const ConnectedZeroExInstantContainer: React.ComponentClass<ConnectedZeroExInstantContainerProps> = connect(
    mapStateToProps,
)(ZeroExInstantContainer);
