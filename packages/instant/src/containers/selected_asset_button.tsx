import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';

import { SecondaryButton } from '../components/secondary_button';
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
    } else if (props.buyOrderState === AsyncProcessState.SUCCESS) {
        return <SecondaryButton text="Success" isDisabled={true} />;
    } else if (props.buyOrderState === AsyncProcessState.PENDING) {
        return <SecondaryButton text="Processing" isDisabled={true} />;
    }

    return <SelectedAssetBuyButton />;
};

export const SelectedAssetButton: React.ComponentClass<SelectedAssetButtonProps> = connect(mapStateToProps)(
    SelectedAssetButtonPresentationComponent,
);
