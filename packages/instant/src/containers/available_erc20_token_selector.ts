import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { State } from '../redux/reducer';
import { ERC20Asset } from '../types';
import { assetUtils } from '../util/asset';

import { ERC20TokenSelector } from '../components/erc20_token_selector';
import { Action, actions } from '../redux/actions';

export interface AvailableERC20TokenSelectorProps {
    onTokenSelect?: (token: ERC20Asset) => void;
}

interface ConnectedState {
    tokens: ERC20Asset[];
}

interface ConnectedDispatch {
    onTokenSelect: (token: ERC20Asset) => void;
}

const mapStateToProps = (state: State, _ownProps: AvailableERC20TokenSelectorProps): ConnectedState => ({
    tokens: assetUtils.getERC20AssetsFromAssets(state.availableAssets || []),
});

const mapDispatchToProps = (
    dispatch: Dispatch<Action>,
    ownProps: AvailableERC20TokenSelectorProps,
): ConnectedDispatch => ({
    onTokenSelect: (token: ERC20Asset) => {
        dispatch(actions.updateSelectedAsset(token));
        dispatch(actions.resetAmount());
        if (ownProps.onTokenSelect) {
            ownProps.onTokenSelect(token);
        }
    },
});

export const AvailableERC20TokenSelector: React.ComponentClass<AvailableERC20TokenSelectorProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ERC20TokenSelector);
