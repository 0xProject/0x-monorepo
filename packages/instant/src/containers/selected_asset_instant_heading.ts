import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { oc } from 'ts-optchain';

import { State } from '../redux/reducer';

import { InstantHeading } from '../components/instant_heading';

export interface InstantHeadingProps {}

interface ConnectedState {
    selectedAssetAmount?: BigNumber;
    totalEthBaseAmount?: BigNumber;
    ethUsdPrice?: BigNumber;
}

const mapStateToProps = (state: State, _ownProps: InstantHeadingProps): ConnectedState => ({
    selectedAssetAmount: state.selectedAssetAmount,
    totalEthBaseAmount: oc(state).latestBuyQuote.worstCaseQuoteInfo.totalEthAmount(),
    ethUsdPrice: state.ethUsdPrice,
});

export const SelectedAssetInstantHeading: React.ComponentClass<InstantHeadingProps> = connect(mapStateToProps)(
    InstantHeading,
);
