import { HttpClient } from '@0x/connect';
import { orderCalculationUtils } from '@0x/order-utils';
import { APIOrder, AssetPairsResponse, OrderbookResponse } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import {
    AssetBuyerError,
    OrderProvider,
    OrderProviderRequest,
    OrderProviderResponse,
    SignedOrderWithRemainingFillableMakerAssetAmount,
} from '../types';
import { assert } from '../utils/assert';

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
            // The contents of metaData is not explicity defined in the spec
            // We check for remainingTakerAssetAmount as a string and use this value if populated
            const metaDataRemainingTakerAssetAmount = _.get(metaData, 'remainingTakerAssetAmount') as
                | string
                | undefined;
            const remainingFillableTakerAssetAmount = metaDataRemainingTakerAssetAmount
                ? new BigNumber(metaDataRemainingTakerAssetAmount)
                : order.takerAssetAmount;
            const remainingFillableMakerAssetAmount = orderCalculationUtils.getMakerFillAmount(
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
     * @param   apiUrl      The standard relayer API base HTTP url you would like to source orders from.
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
        const { makerAssetData, takerAssetData } = orderProviderRequest;
        const orderbookRequest = { baseAssetData: makerAssetData, quoteAssetData: takerAssetData };
        let orderbook: OrderbookResponse;
        try {
            orderbook = await this._sraClient.getOrderbookAsync(orderbookRequest);
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
    /**
     * Given a taker asset data string, return all availabled paired maker asset data strings.
     * @param   takerAssetData   A string representing the taker asset data.
     * @return  An array of asset data strings that can be purchased using takerAssetData.
     */
    public async getAvailableMakerAssetDatasAsync(takerAssetData: string): Promise<string[]> {
        // Return a maximum of 1000 asset datas
        const maxPerPage = 1000;
        const requestOpts = { perPage: maxPerPage };
        const assetPairsRequest = { assetDataA: takerAssetData };
        const fullRequest = {
            ...requestOpts,
            ...assetPairsRequest,
        };
        let response: AssetPairsResponse;
        try {
            response = await this._sraClient.getAssetPairsAsync(fullRequest);
        } catch (err) {
            throw new Error(AssetBuyerError.StandardRelayerApiError);
        }
        return _.map(response.records, item => {
            if (item.assetDataA.assetData === takerAssetData) {
                return item.assetDataB.assetData;
            } else {
                return item.assetDataA.assetData;
            }
        });
    }
}
