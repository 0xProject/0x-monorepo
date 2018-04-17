import { assert } from '@0xproject/assert';
import { schemas } from '@0xproject/json-schemas';
import { SignedOrder } from '@0xproject/types';
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
    OrdersRequestOpts,
    PagedRequestOpts,
    TokenPairsItem,
    TokenPairsRequestOpts,
} from './types';
import { relayerResponseJsonParsers } from './utils/relayer_response_json_parsers';

const TRAILING_SLASHES_REGEX = /\/+$/;
const DEFAULT_PAGED_REQUEST_OPTS: PagedRequestOpts = {
    page: 1,
    perPage: 100,
};
/**
 * This mapping defines how an option property name gets converted into an HTTP request query field
 */
const OPTS_TO_QUERY_FIELD_MAP = {
    perPage: 'per_page',
};

/**
 * This class includes all the functionality related to interacting with a set of HTTP endpoints
 * that implement the standard relayer API v0
 */
export class HttpClient implements Client {
    private _apiEndpointUrl: string;
    /**
     * Format parameters to be appended to http requests into query string form
     */
    private static _buildQueryStringFromHttpParams(params?: object): string {
        // if params are undefined or empty, return an empty string
        if (_.isUndefined(params) || _.isEmpty(params)) {
            return '';
        }
        // format params into a form the api expects
        const formattedParams = _.mapKeys(params, (value: any, key: string) => {
            return _.get(OPTS_TO_QUERY_FIELD_MAP, key, key);
        });
        // stringify the formatted object
        const stringifiedParams = queryString.stringify(formattedParams);
        return `?${stringifiedParams}`;
    }
    /**
     * Instantiates a new HttpClient instance
     * @param   url    The relayer API base HTTP url you would like to interact with
     * @return  An instance of HttpClient
     */
    constructor(url: string) {
        assert.isWebUri('url', url);
        this._apiEndpointUrl = url.replace(TRAILING_SLASHES_REGEX, ''); // remove trailing slashes
    }
    /**
     * Retrieve token pair info from the API
     * @param   requestOpts     Options specifying token information to retrieve and page information, defaults to { page: 1, perPage: 100 }
     * @return  The resulting TokenPairsItems that match the request
     */
    public async getTokenPairsAsync(requestOpts?: TokenPairsRequestOpts & PagedRequestOpts): Promise<TokenPairsItem[]> {
        if (!_.isUndefined(requestOpts)) {
            assert.doesConformToSchema('requestOpts', requestOpts, clientSchemas.tokenPairsRequestOptsSchema);
            assert.doesConformToSchema('requestOpts', requestOpts, clientSchemas.pagedRequestOptsSchema);
        }
        const httpRequestOpts = {
            params: _.defaults({}, requestOpts, DEFAULT_PAGED_REQUEST_OPTS),
        };
        const responseJson = await this._requestAsync('/token_pairs', HttpRequestType.Get, httpRequestOpts);
        const tokenPairs = relayerResponseJsonParsers.parseTokenPairsJson(responseJson);
        return tokenPairs;
    }
    /**
     * Retrieve orders from the API
     * @param   requestOpts     Options specifying orders to retrieve and page information, defaults to { page: 1, perPage: 100 }
     * @return  The resulting SignedOrders that match the request
     */
    public async getOrdersAsync(requestOpts?: OrdersRequestOpts & PagedRequestOpts): Promise<SignedOrder[]> {
        if (!_.isUndefined(requestOpts)) {
            assert.doesConformToSchema('requestOpts', requestOpts, clientSchemas.ordersRequestOptsSchema);
            assert.doesConformToSchema('requestOpts', requestOpts, clientSchemas.pagedRequestOptsSchema);
        }
        const httpRequestOpts = {
            params: _.defaults({}, requestOpts, DEFAULT_PAGED_REQUEST_OPTS),
        };
        const responseJson = await this._requestAsync(`/orders`, HttpRequestType.Get, httpRequestOpts);
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
     * @param   request         An OrderbookRequest instance describing the specific orderbook to retrieve
     * @param   requestOpts     Options specifying page information, defaults to { page: 1, perPage: 100 }
     * @return  The resulting OrderbookResponse that matches the request
     */
    public async getOrderbookAsync(
        request: OrderbookRequest,
        requestOpts?: PagedRequestOpts,
    ): Promise<OrderbookResponse> {
        assert.doesConformToSchema('request', request, clientSchemas.orderBookRequestSchema);
        if (!_.isUndefined(requestOpts)) {
            assert.doesConformToSchema('requestOpts', requestOpts, clientSchemas.pagedRequestOptsSchema);
        }
        const httpRequestOpts = {
            params: _.defaults({}, request, requestOpts, DEFAULT_PAGED_REQUEST_OPTS),
        };
        const responseJson = await this._requestAsync('/orderbook', HttpRequestType.Get, httpRequestOpts);
        const orderbook = relayerResponseJsonParsers.parseOrderbookResponseJson(responseJson);
        return orderbook;
    }
    /**
     * Retrieve fee information from the API
     * @param   request     A FeesRequest instance describing the specific fees to retrieve
     * @return  The resulting FeesResponse that matches the request
     */
    public async getFeesAsync(request: FeesRequest): Promise<FeesResponse> {
        assert.doesConformToSchema('request', request, clientSchemas.feesRequestSchema);
        const httpRequestOpts = {
            payload: request,
        };
        const responseJson = await this._requestAsync('/fees', HttpRequestType.Post, httpRequestOpts);
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
        const query = HttpClient._buildQueryStringFromHttpParams(params);
        const url = `${this._apiEndpointUrl}${path}${query}`;
        const headers = new Headers({
            'content-type': 'application/json',
        });
        const response = await fetch(url, {
            method: requestType,
            body: JSON.stringify(payload),
            headers,
        });
        const text = await response.text();
        if (!response.ok) {
            const errorString = `${response.status} - ${response.statusText}\n${requestType} ${url}\n${text}`;
            throw Error(errorString);
        }
        const result = !_.isEmpty(text) ? JSON.parse(text) : undefined;
        return result;
    }
}
