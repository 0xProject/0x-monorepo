import { HttpClient } from '@0x/connect';
import { APIOrder, OrderbookResponse } from '@0x/types';
import * as _ from 'lodash';

import {
    AssetBuyerError,
    OrderProvider,
    OrderProviderRequest,
    OrderProviderResponse,
    SignedOrderWithRemainingFillableMakerAssetAmount,
} from '../types';
import { assert } from '../utils/assert';
import { orderUtils } from '../utils/order_utils';

export class StandardRelayerAPIOrderProvider implements OrderProvider {
    public readonly apiUrl: string;
    private readonly _sraClient: HttpClient;
    /**
     * Given an array of APIOrder objects from a standard relayer api, return an array
     * of SignedOrderWithRemainingFillableMakerAssetAmounts
     */
    private static _getSignedOrderWithRemainingFillableMakerAssetAmountFromApi(
        apiOrders: APIOrder[],
    ): SignedOrderWithRemainingFillableMakerAssetAmount[] {
        const result = _.map(apiOrders, apiOrder => {
            const { order, metaData } = apiOrder;
            // calculate remainingFillableMakerAssetAmount from api metadata, else assume order is completely fillable
            const remainingFillableTakerAssetAmount = _.get(
                metaData,
                'remainingTakerAssetAmount',
                order.takerAssetAmount,
            );
            const remainingFillableMakerAssetAmount = orderUtils.calculateRemainingMakerAssetAmount(
                order,
                remainingFillableTakerAssetAmount,
            );
            const newOrder = {
                ...order,
                remainingFillableMakerAssetAmount,
            };
            return newOrder;
        });
        return result;
    }
    /**
     * Instantiates a new StandardRelayerAPIOrderProvider instance
     * @param   apiUrl  The standard relayer API base HTTP url you would like to source orders from.
     * @return  An instance of StandardRelayerAPIOrderProvider
     */
    constructor(apiUrl: string) {
        assert.isWebUri('apiUrl', apiUrl);
        this.apiUrl = apiUrl;
        this._sraClient = new HttpClient(apiUrl);
    }
    /**
     * Given an object that conforms to OrderProviderRequest, return the corresponding OrderProviderResponse that satisfies the request.
     * @param   orderProviderRequest   An instance of OrderProviderRequest. See type for more information.
     * @return  An instance of OrderProviderResponse. See type for more information.
     */
    public async getOrdersAsync(orderProviderRequest: OrderProviderRequest): Promise<OrderProviderResponse> {
        assert.isValidOrderProviderRequest('orderProviderRequest', orderProviderRequest);
        const { makerAssetData, takerAssetData, networkId } = orderProviderRequest;
        const orderbookRequest = { baseAssetData: makerAssetData, quoteAssetData: takerAssetData };
        const requestOpts = { networkId };
        let orderbook: OrderbookResponse;
        try {
            orderbook = await this._sraClient.getOrderbookAsync(orderbookRequest, requestOpts);
        } catch (err) {
            throw new Error(AssetBuyerError.StandardRelayerApiError);
        }
        const apiOrders = orderbook.asks.records;
        const orders = StandardRelayerAPIOrderProvider._getSignedOrderWithRemainingFillableMakerAssetAmountFromApi(
            apiOrders,
        );
        return {
            orders,
        };
    }
}
