import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../redux/reducer';
import { OrderProcessState } from '../types';

import { ConnectedAccountPaymentMethod } from './connected_account_payment_method';
import { SelectedAssetBuyOrderProgress } from './selected_asset_buy_order_progress';

interface BuyOrderProgressOrPaymentMethodProps {
    orderProcessState: OrderProcessState;
}
export const BuyOrderProgressOrPaymentMethod = (props: BuyOrderProgressOrPaymentMethodProps) => {
    const { orderProcessState } = props;
    if (
        orderProcessState === OrderProcessState.Processing ||
        orderProcessState === OrderProcessState.Success ||
        orderProcessState === OrderProcessState.Failure
    ) {
        return <SelectedAssetBuyOrderProgress />;
    } else {
        return <ConnectedAccountPaymentMethod />;
    }
    return null;
};

interface ConnectedState extends BuyOrderProgressOrPaymentMethodProps {}

export interface ConnectedBuyOrderProgressOrPaymentMethodProps {}
const mapStateToProps = (state: State, _ownProps: ConnectedBuyOrderProgressOrPaymentMethodProps): ConnectedState => ({
    orderProcessState: state.swapOrderState.processState,
});
export const ConnectedBuyOrderProgressOrPaymentMethod: React.ComponentClass<
    ConnectedBuyOrderProgressOrPaymentMethodProps
> = connect(mapStateToProps)(BuyOrderProgressOrPaymentMethod);
