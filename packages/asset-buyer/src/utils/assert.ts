import { assert as sharedAssert } from '@0x/assert';
import { schemas } from '@0x/json-schemas';

import { OrderProvider, OrderProviderRequest, SwapQuote, SwapQuoteInfo } from '../types';

export const assert = {
    ...sharedAssert,
    isValidSwapQuote(variableName: string, swapQuote: SwapQuote): void {
        sharedAssert.isHexString(`${variableName}.takerAssetData`, swapQuote.takerAssetData);
        sharedAssert.isHexString(`${variableName}.makerAssetData`, swapQuote.makerAssetData);
        sharedAssert.doesConformToSchema(`${variableName}.orders`, swapQuote.orders, schemas.signedOrdersSchema);
        sharedAssert.doesConformToSchema(`${variableName}.feeOrders`, swapQuote.feeOrders, schemas.signedOrdersSchema);
        assert.isValidSwapQuoteInfo(`${variableName}.bestCaseQuoteInfo`, swapQuote.bestCaseQuoteInfo);
        assert.isValidSwapQuoteInfo(`${variableName}.worstCaseQuoteInfo`, swapQuote.worstCaseQuoteInfo);
        sharedAssert.isBigNumber(`${variableName}.makerAssetBuyAmount`, swapQuote.makerAssetBuyAmount);
        // TODO(dave4506) Remove once forwarder features are reimplemented
        // if (buyQuote.feePercentage !== undefined) {
        //     sharedAssert.isNumber(`${variableName}.feePercentage`, buyQuote.feePercentage);
        // }
    },
    isValidSwapQuoteInfo(variableName: string, swapQuoteInfo: SwapQuoteInfo): void {
        sharedAssert.isBigNumber(`${variableName}.takerTokenAmount`, swapQuoteInfo.takerTokenAmount);
        sharedAssert.isBigNumber(`${variableName}.feeTakerTokenAmount`, swapQuoteInfo.feeTakerTokenAmount);
        sharedAssert.isBigNumber(`${variableName}.totalTakerTokenAmount`, swapQuoteInfo.totalTakerTokenAmount);
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
