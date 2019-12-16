import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../../src/constants';
import { MarketOperation, SignedOrderWithFillableAmounts, SwapQuote } from '../../src/types';
import { ProtocolFeeUtils } from '../../src/utils/protocol_fee_utils';

/**
 * Creates a swap quote given orders.
 */
export async function getFullyFillableSwapQuoteWithNoFeesAsync(
    makerAssetData: string,
    takerAssetData: string,
    orders: SignedOrderWithFillableAmounts[],
    operation: MarketOperation,
    gasPrice: BigNumber,
    protocolFeeUtils: ProtocolFeeUtils,
): Promise<SwapQuote> {
    const makerAssetFillAmount = BigNumber.sum(...[0, ...orders.map(o => o.makerAssetAmount)]);
    const totalTakerAssetAmount = BigNumber.sum(...[0, ...orders.map(o => o.takerAssetAmount)]);
    const quoteInfo = {
        makerAssetAmount: makerAssetFillAmount,
        feeTakerAssetAmount: constants.ZERO_AMOUNT,
        takerAssetAmount: totalTakerAssetAmount,
        totalTakerAssetAmount,
        protocolFeeInWeiAmount: await protocolFeeUtils.calculateWorstCaseProtocolFeeAsync(orders, gasPrice),
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
}
