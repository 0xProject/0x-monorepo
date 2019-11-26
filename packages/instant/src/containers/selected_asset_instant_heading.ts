import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { oc } from 'ts-optchain';

import { State } from '../redux/reducer';
import { Asset, AsyncProcessState, OrderState } from '../types';

import { InstantHeading } from '../components/instant_heading';

export interface InstantHeadingProps {
    onSelectAssetClick?: (asset?: Asset) => void;
}

interface ConnectedState {
    selectedAsset?: Asset;
    selectedAssetUnitAmount?: BigNumber;
    totalEthBaseUnitAmount?: BigNumber;
    ethUsdPrice?: BigNumber;
    quoteRequestState: AsyncProcessState;
    swapOrderState: OrderState;
}

const mapStateToProps = (state: State, _ownProps: InstantHeadingProps): ConnectedState => ({
    selectedAsset: state.selectedAsset,
    selectedAssetUnitAmount: state.selectedAssetUnitAmount,
    totalEthBaseUnitAmount: oc(state).latestSwapQuote.worstCaseQuoteInfo.totalTakerAssetAmount(),
    ethUsdPrice: state.ethUsdPrice,
    quoteRequestState: state.quoteRequestState,
    swapOrderState: state.swapOrderState,
});

export const SelectedAssetInstantHeading: React.ComponentClass<InstantHeadingProps> = connect(mapStateToProps)(
    InstantHeading,
);
