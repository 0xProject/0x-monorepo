import { assert } from '@0xproject/assert';
import { schemas } from '@0xproject/json-schemas';
import 'isomorphic-fetch';
import * as _ from 'lodash';
import * as queryString from 'query-string';

import { schemas as clientSchemas } from './schemas/schemas';
import {
    Client,
    FeesRequest,
    FeesResponse,
    HttpRequestOptions,
    HttpRequestType,
    OrderbookRequest,
    OrderbookResponse,
    OrdersRequest,
    SignedOrder,
    TokenPairsItem,
    TokenPairsRequest,
} from './types';
import { relayerResponseJsonParsers } from './utils/relayer_response_json_parsers';

const TRAILING_SLASHES_REGEX = /\/+$/;
/**
 * This class includes all the functionality related to interacting with a set of HTTP endpoints
 * that implement the standard relayer API v0
 */
export class HttpClient implements Client {
    private _apiEndpointUrl: string;
    /**
     * Instantiates a new HttpClient instance
     * @param   url    The relayer API base HTTP url you would like to interact with
     * @return  An instance of HttpClient
     */
    constructor(url: string) {
        assert.isHttpUrl('url', url);
        this._apiEndpointUrl = url.replace(TRAILING_SLASHES_REGEX, ''); // remove trailing slashes
    }
    /**
     * Retrieve token pair info from the API
     * @param   request     A TokenPairsRequest instance describing specific token information
     *                      to retrieve
     * @return  The resulting TokenPairsItems that match the request
     */
    public async getTokenPairsAsync(request?: TokenPairsRequest): Promise<TokenPairsItem[]> {
        if (!_.isUndefined(request)) {
            assert.doesConformToSchema('request', request, clientSchemas.relayerTokenPairsRequestSchema);
        }
        const requestOpts = {
            params: request,
        };
        const responseJson = await this._requestAsync('/token_pairs', HttpRequestType.Get, requestOpts);
        const tokenPairs = relayerResponseJsonParsers.parseTokenPairsJson(responseJson);
        return tokenPairs;
    }
    /**
     * Retrieve orders from the API
     * @param   request     An OrdersRequest instance describing specific orders to retrieve
     * @return  The resulting SignedOrders that match the request
     */
    public async getOrdersAsync(request?: OrdersRequest): Promise<SignedOrder[]> {
        if (!_.isUndefined(request)) {
            assert.doesConformToSchema('request', request, clientSchemas.relayerOrdersRequestSchema);
        }
        const requestOpts = {
            params: request,
        };
        const responseJson = await this._requestAsync(`/orders`, HttpRequestType.Get, requestOpts);
        const orders = relayerResponseJsonParsers.parseOrdersJson(responseJson);
        return orders;
    }
    /**
     * Retrieve a specific order from the API
     * @param   orderHash     An orderHash generated from the desired order
     * @return  The SignedOrder that matches the supplied orderHash
     */
    public async getOrderAsync(orderHash: string): Promise<SignedOrder> {
        assert.doesConformToSchema('orderHash', orderHash, schemas.orderHashSchema);
        const responseJson = await this._requestAsync(`/order/${orderHash}`, HttpRequestType.Get);
        const order = relayerResponseJsonParsers.parseOrderJson(responseJson);
        return order;
    }
    /**
     * Retrieve an orderbook from the API
     * @param   request     An OrderbookRequest instance describing the specific orderbook to retrieve
     * @return  The resulting OrderbookResponse that matches the request
     */
    public async getOrderbookAsync(request: OrderbookRequest): Promise<OrderbookResponse> {
        assert.doesConformToSchema('request', request, clientSchemas.relayerOrderBookRequestSchema);
        const requestOpts = {
            params: request,
        };
        const responseJson = await this._requestAsync('/orderbook', HttpRequestType.Get, requestOpts);
        const orderbook = relayerResponseJsonParsers.parseOrderbookResponseJson(responseJson);
        return orderbook;
    }
    /**
     * Retrieve fee information from the API
     * @param   request     A FeesRequest instance describing the specific fees to retrieve
     * @return  The resulting FeesResponse that matches the request
     */
    public async getFeesAsync(request: FeesRequest): Promise<FeesResponse> {
        assert.doesConformToSchema('request', request, schemas.relayerApiFeesPayloadSchema);
        const requestOpts = {
            payload: request,
        };
        const responseJson = await this._requestAsync('/fees', HttpRequestType.Post, requestOpts);
        const fees = relayerResponseJsonParsers.parseFeesResponseJson(responseJson);
        return fees;
    }
    /**
     * Submit a signed order to the API
     * @param   signedOrder     A SignedOrder instance to submit
     */
    public async submitOrderAsync(signedOrder: SignedOrder): Promise<void> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        const requestOpts = {
            payload: signedOrder,
        };
        await this._requestAsync('/order', HttpRequestType.Post, requestOpts);
    }
    private async _requestAsync(
        path: string,
        requestType: HttpRequestType,
        requestOptions?: HttpRequestOptions,
    ): Promise<any> {
        const params = _.get(requestOptions, 'params');
        const payload = _.get(requestOptions, 'payload');
        let query = '';
        if (!_.isUndefined(params) && !_.isEmpty(params)) {
            const stringifiedParams = queryString.stringify(params);
            query = `?${stringifiedParams}`;
        }
        const url = `${this._apiEndpointUrl}/v0${path}${query}`;
        const headers = new Headers({
            'content-type': 'application/json',
        });
        const response = await fetch(url, {
            method: requestType,
            body: JSON.stringify(payload),
            headers,
        });
        const json = await response.json();
        if (!response.ok) {
            const errorString = `${response.status} - ${response.statusText}\n${requestType} ${url}\n${JSON.stringify(
                json,
            )}`;
            throw Error(errorString);
        }
        return json;
    }
}
