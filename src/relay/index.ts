import 'isomorphic-fetch';
import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import {schemas} from '0x-json-schemas';
import {assert} from '../utils/assert';
import {StandardRelayerApi, SignedOrder} from '../types';
import {relayOptsSchema} from '../schemas';

export class Relay {
    private url: string;
    private version: number;
    constructor(url: string, opts?: StandardRelayerApi.RelayOpts) {
        assert.isString('url', url);
        if (!_.isUndefined(opts)) {
            assert.doesConformToSchema('opts', opts, relayOptsSchema);
        }
        this.url = url;
        this.version = _.isUndefined(opts) ? 0 : opts.version || 0;
    }
    public async getTokenPairsAsync(): Promise<StandardRelayerApi.RelayerApiTokenTradeInfo[]> {
        const tokenPairs = await this._requestAsync('/token_pairs', 'GET');
        _.map(tokenPairs, tokenPair => {
            this._convertStringsFieldsToBigNumbers(tokenPair, [
                'tokenA.minAmount',
                'tokenA.maxAmount',
                'tokenB.minAmount',
                'tokenB.maxAmount',
            ]);
        });
        return tokenPairs;
    }
    public async getOrderAsync(orderHash: string): Promise<StandardRelayerApi.RelayerApiOrderResponse> {
        assert.doesConformToSchema('orderHash', orderHash, schemas.orderHashSchema);
        const order = await this._requestAsync(`/order/${orderHash}`, 'GET');
        this._convertOrderStringFieldsToBigNumber(order);
        return order;
    }
    public async getOrdersAsync(): Promise<StandardRelayerApi.RelayerApiOrderResponse[]> {
        const orders = await this._requestAsync(`/orders`, 'GET');
        _.map(orders, this._convertOrderStringFieldsToBigNumber.bind(this));
        return orders;
    }
    public async getFeesAsync(params: StandardRelayerApi.RelayerApiFeesRequest)
    : Promise<StandardRelayerApi.RelayerApiFeesResponse> {
        assert.doesConformToSchema('params', params, schemas.relayerApiFeesPayloadSchema);
        this._convertBigNumberFieldsToStrings(params, ['makerTokenAmount', 'takerTokenAmount']);
        const fees = await this._requestAsync(`/fees`, 'POST');
        this._convertStringsFieldsToBigNumbers(fees, ['makerFee', 'takerFee']);
        return fees;
    }
    public async submitOrderAsync(signedOrder: SignedOrder)
    : Promise<void> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        await this._requestAsync(`/order`, 'POST');
    }
    private _convertOrderStringFieldsToBigNumber(order: any): void {
        this._convertStringsFieldsToBigNumbers(order, [
            'signedOrder.makerFee',
            'signedOrder.takerFee',
            'signedOrder.makerTokenAmount',
            'signedOrder.takerTokenAmount',
            'signedOrder.salt',
            'signedOrder.expirationUnixTimestampSec',
            'pending.fillAmount',
            'pending.cancelAmount',
            'remainingTakerTokenAmount',
        ]);
    }
    private _convertBigNumberFieldsToStrings(obj: any, fields: string[]): void {
        _.each(fields, field => {
            _.update(obj, field, (value: BigNumber.BigNumber) => value.toString());
        });
    }
    private _convertStringsFieldsToBigNumbers(obj: any, fields: string[]): void {
        _.each(fields, field => {
            _.update(obj, field, (value: string) => new BigNumber(value));
        });
    }
    private async _requestAsync(path: string, method: string): Promise<any> {
        const url = `${this.url}/v${this.version}${path}`;
        const response = await fetch(url, {
            method,
        });
        if (!response.ok) {
            throw Error(response.statusText);
        }
        const json = await response.json();
        return json;
    }
}
