import { BuyQuoteInfo } from '@0x/asset-buyer';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { oc } from 'ts-optchain';

import { State } from '../redux/reducer';

import { OrderDetails } from '../components/order_details';
import { AsyncProcessState } from '../types';

export interface LatestBuyQuoteOrderDetailsProps {}

interface ConnectedState {
    buyQuoteInfo?: BuyQuoteInfo;
    ethUsdPrice?: BigNumber;
    isLoading: boolean;
}

const mapStateToProps = (state: State, _ownProps: LatestBuyQuoteOrderDetailsProps): ConnectedState => ({
    // use the worst case quote info
    buyQuoteInfo: oc(state).latestBuyQuote.worstCaseQuoteInfo(),
    ethUsdPrice: state.ethUsdPrice,
    isLoading: state.quoteRequestState === AsyncProcessState.Pending,
});

export const LatestBuyQuoteOrderDetails: React.ComponentClass<LatestBuyQuoteOrderDetailsProps> = connect(
    mapStateToProps,
)(OrderDetails);
