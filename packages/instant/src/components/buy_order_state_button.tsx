import * as React from 'react';

import { Flex } from '../components/ui/flex';

import { PlacingOrderButton } from '../components/placing_order_button';
import { SelectedAssetBuyButton } from '../containers/selected_asset_buy_button';
import { SelectedAssetRetryButton } from '../containers/selected_asset_retry_button';
import { SelectedAssetViewTransactionButton } from '../containers/selected_asset_view_transaction_button';
import { OrderProcessState } from '../types';

export interface BuyOrderStateButtonProps {
    buyOrderProcessingState: OrderProcessState;
}

// TODO: rename to buttons
export const BuyOrderStateButton: React.StatelessComponent<BuyOrderStateButtonProps> = props => {
    if (props.buyOrderProcessingState === OrderProcessState.FAILURE) {
        return (
            <Flex justify="space-between">
                <SelectedAssetRetryButton width="48%" />
                <SelectedAssetViewTransactionButton width="48%" />
            </Flex>
        );
    } else if (
        props.buyOrderProcessingState === OrderProcessState.SUCCESS ||
        props.buyOrderProcessingState === OrderProcessState.PROCESSING
    ) {
        return <SelectedAssetViewTransactionButton />;
    } else if (props.buyOrderProcessingState === OrderProcessState.AWAITING_SIGNATURE) {
        return <PlacingOrderButton />;
    }

    return <SelectedAssetBuyButton />;
};
