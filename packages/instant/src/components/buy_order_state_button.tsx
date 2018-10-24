import * as React from 'react';

import { PlacingOrderButton } from '../components/placing_order_button';
import { SelectedAssetBuyButton } from '../containers/selected_asset_buy_button';
import { SelectedAssetRetryButton } from '../containers/selected_asset_retry_button';
import { SelectedAssetViewTransactionButton } from '../containers/selected_asset_view_transaction_button';
import { AsyncProcessState } from '../types';

export interface BuyOrderStateButtonProps {
    buyOrderProcessingState: AsyncProcessState;
}

export const BuyOrderStateButton: React.StatelessComponent<BuyOrderStateButtonProps> = props => {
    if (props.buyOrderProcessingState === AsyncProcessState.FAILURE) {
        return <SelectedAssetRetryButton />;
    } else if (props.buyOrderProcessingState === AsyncProcessState.SUCCESS) {
        return <SelectedAssetViewTransactionButton />;
    } else if (props.buyOrderProcessingState === AsyncProcessState.PENDING) {
        return <PlacingOrderButton />;
    }

    return <SelectedAssetBuyButton />;
};
