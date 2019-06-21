import { FillScenarios } from '@0x/fill-scenarios';
import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { SupportedProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { SwapQuote } from '../../src';

const ZERO_BIG_NUMBER = new BigNumber(0);

const getSignedOrdersWithNoFees = (makerAssetData: string, takerAssetData: string, makerAddress: string, takerAssetAmounts: BigNumber[], takerAssetToMakerAssetAmountRatio: number | number[] = 1): SignedOrder[] => {
    return _.map(takerAssetAmounts, (takerAssetAmount: BigNumber, index: number) => orderFactory.createSignedOrderFromPartial(
        {
            makerAddress,
            makerAssetAmount: takerAssetAmount.multipliedBy(typeof takerAssetToMakerAssetAmountRatio === 'number' ? takerAssetToMakerAssetAmountRatio : takerAssetToMakerAssetAmountRatio[index]),
            makerAssetData,
            takerAssetAmount,
            takerAssetData,
        }));
};

const getFullyFillableSwapQuoteWithNoFees = (makerAssetData: string, takerAssetData: string, orders: SignedOrder[]): SwapQuote => {
    const makerAssetFillAmount = _.reduce(orders, (a: BigNumber, c: SignedOrder) => a.plus(c.makerAssetAmount), ZERO_BIG_NUMBER);
    const totalTakerTokenAmount = _.reduce(orders, (a: BigNumber, c: SignedOrder) => a.plus(c.takerAssetAmount), ZERO_BIG_NUMBER);
    const quoteInfo = {
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

export interface DummySwapQuotes {
    fullyFilled: SwapQuote;
    partiallyFilled: SwapQuote;
}

// hard coded varying swap quotes for testing purposes
// tslint:disable: custom-no-magic-numbers
export const getDummySwapQuotesWithNoFees = (makerAssetData: string, takerAssetAmount: string, makerAddress: string): DummySwapQuotes => {
    const dummyOneSignedOrders = getSignedOrdersWithNoFees(
        makerAssetData,
        takerAssetAmount,
        makerAddress,
        [new BigNumber(50), new BigNumber(20), new BigNumber(30)],
        );
    const dummyOneSwapQuote = getFullyFillableSwapQuoteWithNoFees(makerAssetData, takerAssetAmount, dummyOneSignedOrders);

    const dummyTwoSignedOrders = getSignedOrdersWithNoFees(
        makerAssetData,
        takerAssetAmount,
        makerAddress,
        [new BigNumber(50), new BigNumber(20), new BigNumber(30)],
        [2, 1, 3],
        );
    const dummyTwoSwapQuote = getFullyFillableSwapQuoteWithNoFees(makerAssetData, takerAssetAmount, dummyTwoSignedOrders);

    // Paritally fill only 60 percent of the orders of the orders
    dummyTwoSwapQuote.makerAssetFillAmount = dummyTwoSwapQuote.makerAssetFillAmount.multipliedBy(0.6);
    const worstCaseTotalTakerAmount = new BigNumber(58);
    const bestCaseTotalTakerAmount = new BigNumber(48);
    dummyTwoSwapQuote.worstCaseQuoteInfo.takerTokenAmount = worstCaseTotalTakerAmount;
    dummyTwoSwapQuote.worstCaseQuoteInfo.totalTakerTokenAmount = worstCaseTotalTakerAmount;
    dummyTwoSwapQuote.bestCaseQuoteInfo.takerTokenAmount = bestCaseTotalTakerAmount;
    dummyTwoSwapQuote.bestCaseQuoteInfo.totalTakerTokenAmount = bestCaseTotalTakerAmount;

    return {
        fullyFilled: dummyOneSwapQuote,
        partiallyFilled: dummyTwoSwapQuote,
    };
};
