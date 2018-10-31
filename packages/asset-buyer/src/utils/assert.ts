import { assert as sharedAssert } from '@0x/assert';
import { schemas } from '@0x/json-schemas';
import { SignedOrder } from '@0x/types';
import * as _ from 'lodash';

import { BuyQuote, BuyQuoteInfo, OrderProvider, OrderProviderRequest } from '../types';

export const assert = {
    ...sharedAssert,
    isValidBuyQuote(variableName: string, buyQuote: BuyQuote): void {
        sharedAssert.isHexString(`${variableName}.assetData`, buyQuote.assetData);
        sharedAssert.doesConformToSchema(`${variableName}.orders`, buyQuote.orders, schemas.signedOrdersSchema);
        sharedAssert.doesConformToSchema(`${variableName}.feeOrders`, buyQuote.feeOrders, schemas.signedOrdersSchema);
        assert.isValidBuyQuoteInfo(`${variableName}.bestCaseQuoteInfo`, buyQuote.bestCaseQuoteInfo);
        assert.isValidBuyQuoteInfo(`${variableName}.worstCaseQuoteInfo`, buyQuote.worstCaseQuoteInfo);
        sharedAssert.isBigNumber(`${variableName}.assetBuyAmount`, buyQuote.assetBuyAmount);
        if (!_.isUndefined(buyQuote.feePercentage)) {
            sharedAssert.isNumber(`${variableName}.feePercentage`, buyQuote.feePercentage);
        }
    },
    isValidBuyQuoteInfo(variableName: string, buyQuoteInfo: BuyQuoteInfo): void {
        sharedAssert.isBigNumber(`${variableName}.ethPerAssetPrice`, buyQuoteInfo.ethPerAssetPrice);
        sharedAssert.isBigNumber(`${variableName}.feeEthAmount`, buyQuoteInfo.feeEthAmount);
        sharedAssert.isBigNumber(`${variableName}.totalEthAmount`, buyQuoteInfo.totalEthAmount);
    },
    isValidOrderProvider(variableName: string, orderFetcher: OrderProvider): void {
        sharedAssert.isFunction(`${variableName}.getOrdersAsync`, orderFetcher.getOrdersAsync);
    },
    isValidOrderProviderRequest(variableName: string, orderFetcherRequest: OrderProviderRequest): void {
        sharedAssert.isHexString(`${variableName}.makerAssetData`, orderFetcherRequest.makerAssetData);
        sharedAssert.isHexString(`${variableName}.takerAssetData`, orderFetcherRequest.takerAssetData);
    },
    areValidProvidedOrders(variableName: string, orders: SignedOrder[]): void {
        if (orders.length === 0) {
            return;
        }
        const makerAssetData = orders[0].makerAssetData;
        const takerAssetData = orders[0].takerAssetData;
        const filteredOrders = _.filter(
            orders,
            order => order.makerAssetData === makerAssetData && order.takerAssetData === takerAssetData,
        );
        sharedAssert.assert(
            orders.length === filteredOrders.length,
            `Expected all orders in ${variableName} to have the same makerAssetData and takerAssetData.`,
        );
    },
    isValidPercentage(variableName: string, percentage: number): void {
        assert.isNumber(variableName, percentage);
        assert.assert(
            percentage >= 0 && percentage <= 1,
            `Expected ${variableName} to be between 0 and 1, but is ${percentage}`,
        );
    },
};
