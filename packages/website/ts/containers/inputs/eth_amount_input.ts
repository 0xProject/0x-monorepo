import { BigNumber } from '@0x/utils';
import { EthRPCClient } from '@0x/eth-rpc-client';
import * as React from 'react';
import { connect } from 'react-redux';
import { State } from 'ts/redux/reducer';
import { ValidatedBigNumberCallback } from 'ts/types';
import { constants } from 'ts/utils/constants';

import { EthAmountInput as EthAmountInputComponent } from 'ts/components/inputs/eth_amount_input';

interface EthAmountInputProps {
    label?: string;
    amount?: BigNumber;
    hintText?: string;
    onChange: ValidatedBigNumberCallback;
    onErrorMsgChange?: (errorMsg: React.ReactNode) => void;
    shouldShowIncompleteErrs: boolean;
    shouldCheckBalance: boolean;
    shouldShowErrs?: boolean;
    shouldShowUnderline?: boolean;
    style?: React.CSSProperties;
    labelStyle?: React.CSSProperties;
    inputHintStyle?: React.CSSProperties;
}

interface ConnectedState {
    balance: BigNumber;
}

const mapStateToProps = (state: State, _ownProps: EthAmountInputProps): ConnectedState => ({
    balance: EthRPCClient.toUnitAmount(state.userEtherBalanceInWei, constants.DECIMAL_PLACES_ETH),
});

export const EthAmountInput: React.ComponentClass<EthAmountInputProps> = connect(mapStateToProps)(
    EthAmountInputComponent,
);
