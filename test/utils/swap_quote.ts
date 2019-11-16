import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../../src/constants';
import { MarketOperation, PrunedSignedOrder, SwapQuote } from '../../src/types';
import { ProtocolFeeUtils } from '../../src/utils/protocol_fee_utils';

export const getFullyFillableSwapQuoteWithNoFeesAsync = async (
    makerAssetData: string,
    takerAssetData: string,
    orders: PrunedSignedOrder[],
    operation: MarketOperation,
    gasPrice: BigNumber,
    protocolFeeUtils: ProtocolFeeUtils,
): Promise<SwapQuote> => {
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
        protocolFeeInEthAmount: await protocolFeeUtils.calculateWorstCaseProtocolFeeAsync(orders, gasPrice),
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
