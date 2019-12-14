import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../../src/constants';
import { MarketOperation, SignedOrderWithFillableAmounts, SwapQuote } from '../../src/types';
import { ProtocolFeeUtils } from '../../src/utils/protocol_fee_utils';

export const getFullyFillableSwapQuoteWithNoFees = (
    makerAssetData: string,
    takerAssetData: string,
    orders: SignedOrderWithFillableAmounts[],
    operation: MarketOperation,
    gasPrice: BigNumber,
    protocolFeeUtils: ProtocolFeeUtils,
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
        protocolFeeInWeiAmount: protocolFeeUtils.calculateWorstCaseProtocolFee(orders, gasPrice),
    };

    const quoteBase = {
        makerAssetData,
        takerAssetData,
        orders,
        gasPrice,
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
