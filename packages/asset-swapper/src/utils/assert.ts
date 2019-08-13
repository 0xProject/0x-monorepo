import { assert as sharedAssert } from '@0x/assert';
import { schemas } from '@0x/json-schemas';
import { Orderbook } from '@0x/orderbook';
import { MarketOperation, SignedOrder } from '@0x/types';
import * as _ from 'lodash';

import { OrderProvider, OrderProviderRequest, SwapQuote, SwapQuoteInfo } from '../types';

export const assert = {
    ...sharedAssert,
    isValidSwapQuote(variableName: string, swapQuote: SwapQuote): void {
        sharedAssert.isHexString(`${variableName}.takerAssetData`, swapQuote.takerAssetData);
        sharedAssert.isHexString(`${variableName}.makerAssetData`, swapQuote.makerAssetData);
        sharedAssert.doesConformToSchema(`${variableName}.orders`, swapQuote.orders, schemas.signedOrdersSchema);
        sharedAssert.doesConformToSchema(`${variableName}.feeOrders`, swapQuote.feeOrders, schemas.signedOrdersSchema);
        assert.isValidOrdersForSwapQuote(
            `${variableName}.orders`,
            swapQuote.orders,
            swapQuote.makerAssetData,
            swapQuote.takerAssetData,
        );
        assert.isValidSwapQuoteInfo(`${variableName}.bestCaseQuoteInfo`, swapQuote.bestCaseQuoteInfo);
        assert.isValidSwapQuoteInfo(`${variableName}.worstCaseQuoteInfo`, swapQuote.worstCaseQuoteInfo);
        if (swapQuote.type === MarketOperation.Buy) {
            sharedAssert.isBigNumber(`${variableName}.makerAssetFillAmount`, swapQuote.makerAssetFillAmount);
        } else {
            sharedAssert.isBigNumber(`${variableName}.takerAssetFillAmount`, swapQuote.takerAssetFillAmount);
        }
    },
    isValidOrdersForSwapQuote(
        variableName: string,
        orders: SignedOrder[],
        makerAssetData: string,
        takerAssetData: string,
    ): void {
        _.every(orders, (order: SignedOrder, index: number) => {
            assert.assert(
                order.takerAssetData === takerAssetData,
                `Expected ${variableName}[${index}].takerAssetData to be ${takerAssetData} but found ${
                    order.takerAssetData
                }`,
            );
            assert.assert(
                order.makerAssetData === makerAssetData,
                `Expected ${variableName}[${index}].makerAssetData to be ${makerAssetData} but found ${
                    order.makerAssetData
                }`,
            );
        });
    },
    isValidForwarderSwapQuote(variableName: string, swapQuote: SwapQuote, wethAssetData: string): void {
        assert.isValidSwapQuote(variableName, swapQuote);
        assert.isValidForwarderSignedOrders(`${variableName}.orders`, swapQuote.orders, wethAssetData);
        assert.isValidForwarderSignedOrders(`${variableName}.feeOrders`, swapQuote.feeOrders, wethAssetData);
    },
    isValidForwarderSignedOrders(variableName: string, orders: SignedOrder[], wethAssetData: string): void {
        _.forEach(orders, (o: SignedOrder, i: number) => {
            assert.isValidForwarderSignedOrder(`${variableName}[${i}]`, o, wethAssetData);
        });
    },
    isValidForwarderSignedOrder(variableName: string, order: SignedOrder, wethAssetData: string): void {
        assert.assert(
            order.takerAssetData === wethAssetData,
            `Expected ${variableName} to have takerAssetData set as ${wethAssetData}, but is ${order.takerAssetData}`,
        );
    },
    isValidSwapQuoteInfo(variableName: string, swapQuoteInfo: SwapQuoteInfo): void {
        sharedAssert.isBigNumber(`${variableName}.feeTakerTokenAmount`, swapQuoteInfo.feeTakerTokenAmount);
        sharedAssert.isBigNumber(`${variableName}.totalTakerTokenAmount`, swapQuoteInfo.totalTakerTokenAmount);
        sharedAssert.isBigNumber(`${variableName}.takerTokenAmount`, swapQuoteInfo.takerTokenAmount);
        sharedAssert.isBigNumber(`${variableName}.takerTokenAmount`, swapQuoteInfo.makerTokenAmount);
    },
    isValidOrderProvider(variableName: string, orderFetcher: Orderbook): void {
        sharedAssert.isFunction(`${variableName}.getOrdersAsync`, orderFetcher.getOrdersAsync);
    },
    isValidOrderProviderRequest(variableName: string, orderFetcherRequest: OrderProviderRequest): void {
        sharedAssert.isHexString(`${variableName}.makerAssetData`, orderFetcherRequest.makerAssetData);
        sharedAssert.isHexString(`${variableName}.takerAssetData`, orderFetcherRequest.takerAssetData);
    },
    isValidPercentage(variableName: string, percentage: number): void {
        assert.isNumber(variableName, percentage);
        assert.assert(
            percentage >= 0 && percentage <= 1,
            `Expected ${variableName} to be between 0 and 1, but is ${percentage}`,
        );
    },
};
