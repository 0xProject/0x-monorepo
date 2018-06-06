import * as React from 'react';
import { BalanceErrs, Token, TokenState } from 'ts/types';
import { ActionTypes, ProviderType, TokenByAddress, TokenStateByAddress } from 'ts/types';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Blockchain } from 'ts/blockchain';
import { State } from 'ts/redux/reducer';

import { AllowanceToggle as AllowanceToggleComponent } from 'ts/components/inputs/allowance_toggle';
import { Dispatcher } from 'ts/redux/dispatcher';

interface AllowanceToggleProps {
    blockchain: Blockchain;
    onErrorOccurred?: (errType: BalanceErrs) => void;
    token: Token;
    tokenState: TokenState;
    isDisabled: boolean;
    refetchTokenStateAsync: () => Promise<void>;
}

interface ConnectedState {
    networkId: number;
    userAddress: string;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, ownProps: AllowanceToggleProps): ConnectedState => ({
    networkId: state.networkId,
    userAddress: state.userAddress,
});

const mapDispatchTopProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const AllowanceToggle: React.ComponentClass<AllowanceToggleProps> = connect(
    mapStateToProps,
    mapDispatchTopProps,
)(AllowanceToggleComponent);
