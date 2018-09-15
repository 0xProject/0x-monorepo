import { schemas } from '@0xproject/json-schemas';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    AssetBuyerError,
    OrderFetcher,
    OrderFetcherRequest,
    OrderFetcherResponse,
    SignedOrderWithRemainingFillableMakerAssetAmount,
} from '../types';
import { assert } from '../utils/assert';
import { orderUtils } from '../utils/order_utils';

export class ProvidedOrderFetcher implements OrderFetcher {
    public readonly providedOrders: SignedOrder[];
    /**
     * Instantiates a new ProvidedOrderFetcher instance
     * @param   providedOrders  An array of objects that conform to SignedOrder to fetch from.
     * @return  An instance of ProvidedOrderFetcher
     */
    constructor(providedOrders: SignedOrder[]) {
        assert.doesConformToSchema('providedOrders', providedOrders, schemas.signedOrdersSchema);
        this.providedOrders = providedOrders;
    }
    /**
     * Given an object that conforms to OrderFetcherRequest, return the corresponding OrderFetcherResponse that satisfies the request.
     * @param   orderFetchRequest   An instance of OrderFetcherRequest. See type for more information.
     * @return  An instance of OrderFetcherResponse. See type for more information.
     */
    public async fetchOrdersAsync(orderFetchRequest: OrderFetcherRequest): Promise<OrderFetcherResponse> {
        assert.isValidOrderFetcherRequest('orderFetchRequest', orderFetchRequest);
        const { makerAssetData, takerAssetData } = orderFetchRequest;
        const orders = _.filter(this.providedOrders, order => {
            return order.makerAssetData === makerAssetData && order.takerAssetData === takerAssetData;
        });
        return { orders };
    }
}
