import { AssetBuyer, BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { State } from '../redux/reducer';
import { AsyncProcessState } from '../types';

import { SelectedAssetBuyButton } from './selected_asset_buy_button';
import { SelectedAssetRetryButton } from './selected_asset_retry_button';

interface ConnectedState {
    buyOrderState: AsyncProcessState;
}
export interface SelectedAssetButtonProps {}
const mapStateToProps = (state: State, _ownProps: SelectedAssetButtonProps): ConnectedState => ({
    buyOrderState: state.buyOrderState,
});

const SelectedAssetButtonPresentationComponent: React.StatelessComponent<{
    buyOrderState: AsyncProcessState;
}> = props => {
    if (props.buyOrderState === AsyncProcessState.FAILURE) {
        return <SelectedAssetRetryButton />;
    }

    return <SelectedAssetBuyButton />;
};

export const SelectedAssetButton: React.ComponentClass<SelectedAssetButtonProps> = connect(mapStateToProps)(
    SelectedAssetButtonPresentationComponent,
);
