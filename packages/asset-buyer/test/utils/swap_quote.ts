import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { SignedOrder, MarketOperation } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { SwapQuote } from '../../src/types';

const ZERO_BIG_NUMBER = new BigNumber(0);

export const getSignedOrdersWithNoFees = (
    makerAssetData: string,
    takerAssetData: string,
    makerAddress: string,
    takerAddress: string,
    fillableAmounts: BigNumber[],
): SignedOrder[] => {
    return _.map(fillableAmounts, (fillableAmount: BigNumber) =>
        orderFactory.createSignedOrderFromPartial({
            makerAddress,
            makerAssetAmount: fillableAmount,
            makerAssetData,
            takerAssetAmount: fillableAmount,
            takerAssetData,
        }),
    );
};

export const getFullyFillableSwapQuoteWithNoFees = (
    makerAssetData: string,
    takerAssetData: string,
    orders: SignedOrder[],
    operation: MarketOperation,
): SwapQuote => {
    const makerAssetFillAmount = _.reduce(
        orders,
        (a: BigNumber, c: SignedOrder) => a.plus(c.makerAssetAmount),
        ZERO_BIG_NUMBER,
    );
    const totalTakerTokenAmount = _.reduce(
        orders,
        (a: BigNumber, c: SignedOrder) => a.plus(c.takerAssetAmount),
        ZERO_BIG_NUMBER,
    );
    const quoteInfo = {
        makerTokenAmount: makerAssetFillAmount,
        takerTokenAmount: totalTakerTokenAmount,
        feeTakerTokenAmount: ZERO_BIG_NUMBER,
        totalTakerTokenAmount,
    };

    const quoteBase = {
        makerAssetData,
        takerAssetData,
        orders,
        feeOrders: [],
        bestCaseQuoteInfo: quoteInfo,
        worstCaseQuoteInfo: quoteInfo,
    };

    if (operation === 'marketBuy') {
        return {
            ...quoteBase,
            type: 'marketBuy',
            makerAssetFillAmount,
        };
    } else {
        return {
            ...quoteBase,
            type: 'marketSell',
            takerAssetFillAmount: totalTakerTokenAmount,
        };
    }
};
