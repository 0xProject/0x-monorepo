import { FillScenarios } from '@0x/fill-scenarios';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { SwapQuote } from '../../src';

const ZERO_BIG_NUMBER = new BigNumber(0);
export const getSignedOrdersWithNoFees = async (fillScenarios: FillScenarios, makerAssetData: string, takerAssetData: string, makerAddress: string, takerAddress: string, fillableAmounts: BigNumber[]): Promise<SignedOrder[]> => {
    return Promise.all(_.map(fillableAmounts, async (fillableAmount: BigNumber) => fillScenarios.createFillableSignedOrderAsync(
        makerAssetData,
        takerAssetData,
        makerAddress,
        takerAddress,
        fillableAmount,
    )));
};

export const getFullyFillableSwapQuoteWithNoFees = (makerAssetData: string, takerAssetData: string, orders: SignedOrder[]): SwapQuote => {
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
