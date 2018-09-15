import { assert as sharedAssert } from '@0xproject/assert';
import { schemas } from '@0xproject/json-schemas';
import * as _ from 'lodash';

import { BuyQuote, OrderFetcher } from '../types';

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
};
