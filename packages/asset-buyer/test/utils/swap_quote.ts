import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { MarketBuySwapQuote, MarketSellSwapQuote } from '../../src';

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

export const getFullyFillableMarketBuySwapQuoteWithNoFees = (
    makerAssetData: string,
    takerAssetData: string,
    orders: SignedOrder[],
): MarketBuySwapQuote => {
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

    return {
        makerAssetData,
        takerAssetData,
        orders,
        feeOrders: [],
        makerAssetFillAmount,
        bestCaseQuoteInfo: quoteInfo,
        worstCaseQuoteInfo: quoteInfo,
    };
};

export const getFullyFillableMarketSellSwapQuoteWithNoFees = (
    makerAssetData: string,
    takerAssetData: string,
    orders: SignedOrder[],
): MarketSellSwapQuote => {
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

    return {
        makerAssetData,
        takerAssetData,
        orders,
        feeOrders: [],
        takerAssetFillAmount: totalTakerTokenAmount,
        bestCaseQuoteInfo: quoteInfo,
        worstCaseQuoteInfo: quoteInfo,
    };
};
