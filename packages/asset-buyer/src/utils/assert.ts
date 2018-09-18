import { assert as sharedAssert } from '@0xproject/assert';
import { schemas } from '@0xproject/json-schemas';
import { SignedOrder } from '@0xproject/types';
import * as _ from 'lodash';

import { BuyQuote, OrderFetcher, OrderFetcherRequest } from '../types';

export const assert = {
    ...sharedAssert,
    isValidBuyQuote(variableName: string, buyQuote: BuyQuote): void {
        sharedAssert.isHexString(`${variableName}.assetData`, buyQuote.assetData);
        sharedAssert.doesConformToSchema(`${variableName}.orders`, buyQuote.orders, schemas.signedOrdersSchema);
        sharedAssert.doesConformToSchema(`${variableName}.feeOrders`, buyQuote.feeOrders, schemas.signedOrdersSchema);
        sharedAssert.isBigNumber(`${variableName}.minRate`, buyQuote.minRate);
        sharedAssert.isBigNumber(`${variableName}.maxRate`, buyQuote.maxRate);
        sharedAssert.isBigNumber(`${variableName}.assetBuyAmount`, buyQuote.assetBuyAmount);
        if (!_.isUndefined(buyQuote.feePercentage)) {
            sharedAssert.isNumber(`${variableName}.feePercentage`, buyQuote.feePercentage);
        }
    },
    isValidOrderFetcher(variableName: string, orderFetcher: OrderFetcher): void {
        sharedAssert.isFunction(`${variableName}.fetchOrdersAsync`, orderFetcher.fetchOrdersAsync);
    },
    isValidOrderFetcherRequest(variableName: string, orderFetcherRequest: OrderFetcherRequest): void {
        sharedAssert.isHexString(`${variableName}.makerAssetData`, orderFetcherRequest.makerAssetData);
        sharedAssert.isHexString(`${variableName}.takerAssetData`, orderFetcherRequest.takerAssetData);
        sharedAssert.isNumber(`${variableName}.networkId`, orderFetcherRequest.networkId);
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
