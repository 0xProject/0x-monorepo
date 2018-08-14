import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Blockchain } from 'ts/blockchain';
import { PointerDirection } from 'ts/components/ui/pointer';
import { State } from 'ts/redux/reducer';
import { BalanceErrs, Token, TokenState } from 'ts/types';

import { AllowanceStateToggle as AllowanceStateToggleComponent } from 'ts/components/inputs/allowance_state_toggle';
import { Dispatcher } from 'ts/redux/dispatcher';

interface AllowanceStateToggleProps {
    blockchain: Blockchain;
    onErrorOccurred?: (errType: BalanceErrs) => void;
    token: Token;
    tokenState: TokenState;
    refetchTokenStateAsync: () => Promise<void>;
    tooltipDirection?: PointerDirection;
}

interface ConnectedState {
    networkId: number;
    userAddress: string;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, _ownProps: AllowanceStateToggleProps): ConnectedState => ({
    networkId: state.networkId,
    userAddress: state.userAddress,
});

const mapDispatchTopProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const AllowanceStateToggle: React.ComponentClass<AllowanceStateToggleProps> = connect(
    mapStateToProps,
    mapDispatchTopProps,
)(AllowanceStateToggleComponent);
