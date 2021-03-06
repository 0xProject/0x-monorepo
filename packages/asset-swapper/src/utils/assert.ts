import { assert as sharedAssert } from '@0x/assert';
import { schemas } from '@0x/json-schemas';
import { Orderbook } from '@0x/orderbook';
import { Order, SignedOrder } from '@0x/types';
import * as _ from 'lodash';

import { MarketOperation, OrderProviderRequest, SwapQuote, SwapQuoteInfo } from '../types';

import {
    isAssetDataEquivalent,
    isExactAssetData,
    isOrderTakerFeePayableWithMakerAsset,
    isOrderTakerFeePayableWithTakerAsset,
} from './utils';

export const assert = {
    ...sharedAssert,
    isValidSwapQuote(variableName: string, swapQuote: SwapQuote): void {
        sharedAssert.isHexString(`${variableName}.takerAssetData`, swapQuote.takerAssetData);
        sharedAssert.isHexString(`${variableName}.makerAssetData`, swapQuote.makerAssetData);
        sharedAssert.doesConformToSchema(`${variableName}.orders`, swapQuote.orders, schemas.signedOrdersSchema);
        if (swapQuote.isTwoHop) {
            assert.isValidTwoHopSwapQuoteOrders(
                `${variableName}.orders`,
                swapQuote.orders,
                swapQuote.makerAssetData,
                swapQuote.takerAssetData,
            );
        } else {
            assert.isValidSwapQuoteOrders(
                `${variableName}.orders`,
                swapQuote.orders,
                swapQuote.makerAssetData,
                swapQuote.takerAssetData,
            );
        }
        assert.isValidSwapQuoteInfo(`${variableName}.bestCaseQuoteInfo`, swapQuote.bestCaseQuoteInfo);
        assert.isValidSwapQuoteInfo(`${variableName}.worstCaseQuoteInfo`, swapQuote.worstCaseQuoteInfo);
        if (swapQuote.type === MarketOperation.Buy) {
            sharedAssert.isBigNumber(`${variableName}.makerAssetFillAmount`, swapQuote.makerAssetFillAmount);
        } else {
            sharedAssert.isBigNumber(`${variableName}.takerAssetFillAmount`, swapQuote.takerAssetFillAmount);
        }
    },
    isValidSwapQuoteOrders(
        variableName: string,
        orders: SignedOrder[],
        makerAssetData: string,
        takerAssetData: string,
    ): void {
        _.every(orders, (order: SignedOrder, index: number) => {
            assert.assert(
                isAssetDataEquivalent(takerAssetData, order.takerAssetData),
                `Expected ${variableName}[${index}].takerAssetData to be ${takerAssetData} but found ${
                    order.takerAssetData
                }`,
            );
            assert.assert(
                isAssetDataEquivalent(makerAssetData, order.makerAssetData),
                `Expected ${variableName}[${index}].makerAssetData to be ${makerAssetData} but found ${
                    order.makerAssetData
                }`,
            );
        });
    },
    isValidTwoHopSwapQuoteOrders(
        variableName: string,
        orders: SignedOrder[],
        makerAssetData: string,
        takerAssetData: string,
    ): void {
        assert.assert(orders.length === 2, `Expected ${variableName}.length to be 2 for a two-hop quote`);
        assert.assert(
            isAssetDataEquivalent(takerAssetData, orders[0].takerAssetData),
            `Expected ${variableName}[0].takerAssetData to be ${takerAssetData} but found ${orders[0].takerAssetData}`,
        );
        assert.assert(
            isAssetDataEquivalent(makerAssetData, orders[1].makerAssetData),
            `Expected ${variableName}[1].makerAssetData to be ${makerAssetData} but found ${orders[1].makerAssetData}`,
        );
        assert.assert(
            isAssetDataEquivalent(orders[0].makerAssetData, orders[1].takerAssetData),
            `Expected ${variableName}[0].makerAssetData (${
                orders[0].makerAssetData
            }) to equal ${variableName}[1].takerAssetData (${orders[1].takerAssetData})`,
        );
    },
    isValidOrdersForSwapQuoter<T extends Order>(variableName: string, orders: T[]): void {
        _.every(orders, (order: T, index: number) => {
            assert.assert(
                order.takerFee.isZero() ||
                    isOrderTakerFeePayableWithTakerAsset(order) ||
                    isOrderTakerFeePayableWithMakerAsset(order),
                `Expected ${variableName}[${index}].takerFeeAssetData to be ${order.makerAssetData} or ${
                    order.takerAssetData
                } but found ${order.takerFeeAssetData}`,
            );
        });
    },
    isValidForwarderSwapQuote(variableName: string, swapQuote: SwapQuote, wethAssetData: string): void {
        assert.isValidSwapQuote(variableName, swapQuote);
        assert.isValidForwarderSignedOrders(`${variableName}.orders`, swapQuote.orders, wethAssetData);
    },
    isValidForwarderSignedOrders(variableName: string, orders: SignedOrder[], wethAssetData: string): void {
        _.forEach(orders, (o: SignedOrder, i: number) => {
            assert.isValidForwarderSignedOrder(`${variableName}[${i}]`, o, wethAssetData);
        });
    },
    isValidForwarderSignedOrder(variableName: string, order: SignedOrder, wethAssetData: string): void {
        assert.assert(
            isExactAssetData(order.takerAssetData, wethAssetData),
            `Expected ${variableName} to have takerAssetData set as ${wethAssetData}, but is ${order.takerAssetData}`,
        );
    },
    isValidSwapQuoteInfo(variableName: string, swapQuoteInfo: SwapQuoteInfo): void {
        sharedAssert.isNumber(`${variableName}.gas`, swapQuoteInfo.gas);
        sharedAssert.isBigNumber(`${variableName}.feeTakerAssetAmount`, swapQuoteInfo.feeTakerAssetAmount);
        sharedAssert.isBigNumber(`${variableName}.totalTakerAssetAmount`, swapQuoteInfo.totalTakerAssetAmount);
        sharedAssert.isBigNumber(`${variableName}.takerAssetAmount`, swapQuoteInfo.takerAssetAmount);
        sharedAssert.isBigNumber(`${variableName}.makerAssetAmount`, swapQuoteInfo.makerAssetAmount);
    },
    isValidOrderbook(variableName: string, orderFetcher: Orderbook): void {
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
    isValidForwarderExtensionContractOpts(variableName: string, opts: any): void {
        assert.isValidPercentage(`${variableName}.feePercentage`, opts.feePercentage);
        assert.isETHAddressHex(`${variableName}.feeRecipient`, opts.feeRecipient);
    },
};
