import { BigNumber } from '@0xproject/utils';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { State } from '../redux/reducer';
import { ColorOption } from '../style/theme';
import { Action, ActionTypes } from '../types';

import { AmountInput } from '../components/amount_input';

export interface SelectedAssetAmountInputProps {
    fontColor?: ColorOption;
    fontSize?: string;
}

interface ConnectedState {
    value?: BigNumber;
}

interface ConnectedDispatch {
    onChange?: (value: BigNumber) => void;
}

const mapStateToProps = (state: State, _ownProps: SelectedAssetAmountInputProps): ConnectedState => ({
    value: state.selectedAssetAmount,
});

const mapDispatchToProps = (dispatch: Dispatch<Action>): ConnectedDispatch => ({
    onChange: value => dispatch({ type: ActionTypes.UPDATE_SELECTED_ASSET_AMOUNT, data: value }),
});

export const SelectedAssetAmountInput: React.ComponentClass<SelectedAssetAmountInputProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(AmountInput);
