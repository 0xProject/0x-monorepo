import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { ERC20BridgeSource } from '../../src';
import { constants } from '../../src/constants';
import { MarketOperation, SignedOrderWithFillableAmounts, SwapQuote } from '../../src/types';

/**
 * Creates a swap quote given orders.
 */
export async function getFullyFillableSwapQuoteWithNoFeesAsync(
    makerAssetData: string,
    takerAssetData: string,
    orders: SignedOrderWithFillableAmounts[],
    operation: MarketOperation,
    gasPrice: BigNumber,
): Promise<SwapQuote> {
    const makerAssetFillAmount = BigNumber.sum(...[0, ...orders.map(o => o.makerAssetAmount)]);
    const totalTakerAssetAmount = BigNumber.sum(...[0, ...orders.map(o => o.takerAssetAmount)]);
    const protocolFeePerOrder = constants.PROTOCOL_FEE_MULTIPLIER.times(gasPrice);
    const quoteInfo = {
        makerAssetAmount: makerAssetFillAmount,
        feeTakerAssetAmount: constants.ZERO_AMOUNT,
        takerAssetAmount: totalTakerAssetAmount,
        totalTakerAssetAmount,
        protocolFeeInWeiAmount: protocolFeePerOrder.times(orders.length),
        gas: 200e3,
    };

    const breakdown = {
        [ERC20BridgeSource.Native]: new BigNumber(1),
    };

    const quoteBase = {
        makerAssetData,
        takerAssetData,
        orders: orders.map(order => ({ ...order, fills: [] })),
        gasPrice,
        bestCaseQuoteInfo: quoteInfo,
        worstCaseQuoteInfo: quoteInfo,
        sourceBreakdown: breakdown,
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
