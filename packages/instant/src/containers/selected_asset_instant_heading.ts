import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { oc } from 'ts-optchain';

import { State } from '../redux/reducer';
import { AsyncProcessState, ERC20Asset, OrderState } from '../types';

import { InstantHeading } from '../components/instant_heading';

export interface InstantHeadingProps {
    onSelectAssetClick?: (asset?: ERC20Asset) => void;
}

interface ConnectedState {
    selectedAssetAmount?: BigNumber;
    totalEthBaseAmount?: BigNumber;
    ethUsdPrice?: BigNumber;
    quoteRequestState: AsyncProcessState;
    buyOrderState: OrderState;
}

const mapStateToProps = (state: State, _ownProps: InstantHeadingProps): ConnectedState => ({
    selectedAssetAmount: state.selectedAssetAmount,
    totalEthBaseAmount: oc(state).latestBuyQuote.worstCaseQuoteInfo.totalEthAmount(),
    ethUsdPrice: state.ethUsdPrice,
    quoteRequestState: state.quoteRequestState,
    buyOrderState: state.buyOrderState,
});

export const SelectedAssetInstantHeading: React.ComponentClass<InstantHeadingProps> = connect(mapStateToProps)(
    InstantHeading,
);
