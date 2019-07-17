import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { MarketOperation, SignedOrder } from '@0x/types';
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

export const getSignedOrdersWithFees = (
    makerAssetData: string,
    takerAssetData: string,
    makerAddress: string,
    takerAddress: string,
    fillableAmounts: BigNumber[],
    takerFees: BigNumber[],
): SignedOrder[] => {
    const orders = getSignedOrdersWithNoFees(
        makerAssetData,
        takerAssetData,
        makerAddress,
        takerAddress,
        fillableAmounts,
    );
    return _.map(orders, (order: SignedOrder, index: number) =>
        orderFactory.createSignedOrderFromPartial({
            ...order,
            ...{ takerFee: takerFees[index] },
        }),
    );
};

export const getFullyFillableSwapQuoteWithFees = (
    makerAssetData: string,
    takerAssetData: string,
    orders: SignedOrder[],
    feeOrders: SignedOrder[],
    operation: MarketOperation,
) => {
    const swapQuote = getFullyFillableSwapQuoteWithNoFees(
        makerAssetData,
        takerAssetData,
        orders,
        operation,
    );
    swapQuote.feeOrders = feeOrders;
    const totalFeeTakerTokenAmount = _.reduce(
        feeOrders,
        (a: BigNumber, c: SignedOrder) => a.plus(c.takerAssetAmount),
        ZERO_BIG_NUMBER,
    );
    // Adds fees to the SwapQuoteInfos assuming all feeOrders will be filled
    swapQuote.bestCaseQuoteInfo.feeTakerTokenAmount = totalFeeTakerTokenAmount;
    swapQuote.worstCaseQuoteInfo.feeTakerTokenAmount = totalFeeTakerTokenAmount;
    swapQuote.bestCaseQuoteInfo.totalTakerTokenAmount = swapQuote.bestCaseQuoteInfo.totalTakerTokenAmount.plus(totalFeeTakerTokenAmount);
    swapQuote.worstCaseQuoteInfo.totalTakerTokenAmount = swapQuote.worstCaseQuoteInfo.totalTakerTokenAmount.plus(totalFeeTakerTokenAmount);
    return swapQuote;
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

    if (operation === MarketOperation.Buy) {
        return {
            ...quoteBase,
            type: MarketOperation.Buy,
            makerAssetFillAmount,
        };
    } else {
        return {
            ...quoteBase,
            type: MarketOperation.Sell,
            takerAssetFillAmount: totalTakerTokenAmount,
        };
    }
};
