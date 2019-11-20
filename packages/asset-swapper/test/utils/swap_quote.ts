import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../../src/constants';
import { MarketOperation, PrunedSignedOrder, SwapQuote } from '../../src/types';
import { protocolFeeUtils } from '../../src/utils/protocol_fee_utils';

export const getFullyFillableSwapQuoteWithNoFees = (
    makerAssetData: string,
    takerAssetData: string,
    orders: PrunedSignedOrder[],
    operation: MarketOperation,
    gasPrice: BigNumber,
): SwapQuote => {
    const makerAssetFillAmount = _.reduce(
        orders,
        (a: BigNumber, c: SignedOrder) => a.plus(c.makerAssetAmount),
        constants.ZERO_AMOUNT,
    );
    const totalTakerAssetAmount = _.reduce(
        orders,
        (a: BigNumber, c: SignedOrder) => a.plus(c.takerAssetAmount),
        constants.ZERO_AMOUNT,
    );
    const quoteInfo = {
        makerAssetAmount: makerAssetFillAmount,
        feeTakerAssetAmount: constants.ZERO_AMOUNT,
        takerAssetAmount: totalTakerAssetAmount,
        totalTakerAssetAmount,
        protocolFeeInEthAmount: protocolFeeUtils.calculateWorstCaseProtocolFee(orders, gasPrice),
    };

    const quoteBase = {
        makerAssetData,
        takerAssetData,
        orders,
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
            takerAssetFillAmount: totalTakerAssetAmount,
        };
    }
};
