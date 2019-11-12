import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { oc } from 'ts-optchain';

import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';

import { OrderDetails, OrderDetailsProps } from '../components/order_details';
import { AsyncProcessState, BaseCurrency, Omit } from '../types';
import { assetUtils } from '../util/asset';

type DispatchProperties = 'onBaseCurrencySwitchEth' | 'onBaseCurrencySwitchUsd';

interface ConnectedState extends Omit<OrderDetailsProps, DispatchProperties> {}
const mapStateToProps = (state: State, _ownProps: LatestBuyQuoteOrderDetailsProps): ConnectedState => ({
    // use the worst case quote info
    buyQuoteInfo: oc(state).latestSwapQuote.worstCaseQuoteInfo(),
    selectedAssetUnitAmount: state.selectedAssetUnitAmount,
    ethUsdPrice: state.ethUsdPrice,
    isLoading: state.quoteRequestState === AsyncProcessState.Pending,
    assetName: assetUtils.bestNameForAsset(state.selectedAsset),
    baseCurrency: state.baseCurrency,
});

interface ConnectedDispatch extends Pick<OrderDetailsProps, DispatchProperties> {}
const mapDispatchToProps = (dispatch: Dispatch<Action>): ConnectedDispatch => ({
    onBaseCurrencySwitchEth: () => {
        dispatch(actions.updateBaseCurrency(BaseCurrency.ETH));
    },
    onBaseCurrencySwitchUsd: () => {
        dispatch(actions.updateBaseCurrency(BaseCurrency.USD));
    },
});

export interface LatestBuyQuoteOrderDetailsProps {}
export const LatestBuyQuoteOrderDetails: React.ComponentClass<LatestBuyQuoteOrderDetailsProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(OrderDetails);
