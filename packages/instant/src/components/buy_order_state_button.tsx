import * as React from 'react';

import { SelectedAssetBuyButton } from '../containers/selected_asset_buy_button';
import { SelectedAssetRetryButton } from '../containers/selected_asset_retry_button';

import { AsyncProcessState } from '../types';

import { SecondaryButton } from './secondary_button';

export interface BuyOrderStateButtonProps {
    buyOrderState: AsyncProcessState;
}

export const BuyOrderStateButton: React.StatelessComponent<BuyOrderStateButtonProps> = props => {
    if (props.buyOrderState === AsyncProcessState.FAILURE) {
        return <SelectedAssetRetryButton />;
    } else if (props.buyOrderState === AsyncProcessState.SUCCESS) {
        return <SecondaryButton text="Success" isDisabled={true} />;
    } else if (props.buyOrderState === AsyncProcessState.PENDING) {
        return <SecondaryButton text="Processing" isDisabled={true} />;
    }

    return <SelectedAssetBuyButton />;
};
