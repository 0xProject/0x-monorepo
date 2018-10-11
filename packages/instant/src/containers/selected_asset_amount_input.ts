import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { zrxContractAddress, zrxDecimals } from '../constants';
import { State } from '../redux/reducer';
import { ColorOption } from '../style/theme';
import { Action, ActionTypes, AsyncProcessState } from '../types';
import { assetBuyer } from '../util/asset_buyer';

import { AmountInput } from '../components/amount_input';

export interface SelectedAssetAmountInputProps {
    fontColor?: ColorOption;
    fontSize?: string;
}

interface ConnectedState {
    value?: BigNumber;
}

interface ConnectedDispatch {
    onChange?: (value?: BigNumber) => void;
}

const mapStateToProps = (state: State, _ownProps: SelectedAssetAmountInputProps): ConnectedState => ({
    value: state.selectedAssetAmount,
});

const mapDispatchToProps = (dispatch: Dispatch<Action>): ConnectedDispatch => ({
    onChange: async value => {
        // Update the input
        dispatch({ type: ActionTypes.UPDATE_SELECTED_ASSET_AMOUNT, data: value });
        // invalidate the last buy quote.
        dispatch({ type: ActionTypes.UPDATE_LATEST_BUY_QUOTE, data: undefined });
        // reset our buy state
        dispatch({ type: ActionTypes.UPDATE_SELECTED_ASSET_BUY_STATE, data: AsyncProcessState.NONE });
        if (!_.isUndefined(value)) {
            // get a new buy quote.
            const baseUnitValue = Web3Wrapper.toBaseUnitAmount(value, zrxDecimals);
            const newBuyQuote = await assetBuyer.getBuyQuoteForERC20TokenAddressAsync(
                zrxContractAddress,
                baseUnitValue,
            );
            // invalidate the last buy quote.
            dispatch({ type: ActionTypes.UPDATE_LATEST_BUY_QUOTE, data: newBuyQuote });
        }
    },
});

export const SelectedAssetAmountInput: React.ComponentClass<SelectedAssetAmountInputProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(AmountInput);
