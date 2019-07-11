import { assert as sharedAssert } from '@0x/assert';
import { schemas } from '@0x/json-schemas';

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
        if (buyQuote.feePercentage !== undefined) {
            sharedAssert.isNumber(`${variableName}.feePercentage`, buyQuote.feePercentage);
        }
    },
    isValidBuyQuoteInfo(variableName: string, buyQuoteInfo: BuyQuoteInfo): void {
        sharedAssert.isBigNumber(`${variableName}.assetEthAmount`, buyQuoteInfo.assetEthAmount);
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
    isValidPercentage(variableName: string, percentage: number): void {
        assert.isNumber(variableName, percentage);
        assert.assert(
            percentage >= 0 && percentage <= 1,
            `Expected ${variableName} to be between 0 and 1, but is ${percentage}`,
        );
    },
};
