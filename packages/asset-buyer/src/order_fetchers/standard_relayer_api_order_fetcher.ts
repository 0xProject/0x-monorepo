import { APIOrder, HttpClient, OrderbookResponse } from '@0xproject/connect';
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

export class StandardRelayerAPIOrderFetcher implements OrderFetcher {
    public readonly apiUrl: string;
    private _sraClient: HttpClient;
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
     * Instantiates a new StandardRelayerAPIOrderFetcher instance
     * @param   apiUrl  The relayer API base HTTP url you would like to interact with.
     * @return  An instance of StandardRelayerAPIOrderFetcher
     */
    constructor(apiUrl: string) {
        assert.isWebUri('apiUrl', apiUrl);
        this.apiUrl = apiUrl;
        this._sraClient = new HttpClient(apiUrl);
    }
    /**
     * Given an object that conforms to OrderFetcherRequest, return the corresponding OrderFetcherResponse that satisfies the request.
     * @param   orderFetchRequest   An instance of OrderFetcherRequest. See type for more information.
     * @return  An instance of OrderFetcherResponse. See type for more information.
     */
    public async fetchOrdersAsync(orderFetchRequest: OrderFetcherRequest): Promise<OrderFetcherResponse> {
        assert.isValidOrderFetcherRequest('orderFetchRequest', orderFetchRequest);
        const { makerAssetData, takerAssetData, networkId } = orderFetchRequest;
        const orderbookRequest = { baseAssetData: makerAssetData, quoteAssetData: takerAssetData };
        const requestOpts = { networkId };
        let orderbook: OrderbookResponse;
        try {
            orderbook = await this._sraClient.getOrderbookAsync(orderbookRequest, requestOpts);
        } catch (err) {
            throw new Error(AssetBuyerError.StandardRelayerApiError);
        }
        const apiOrders = orderbook.asks.records;
        const orders = StandardRelayerAPIOrderFetcher._getSignedOrderWithRemainingFillableMakerAssetAmountFromApi(
            apiOrders,
        );
        return {
            orders,
        };
    }
}
