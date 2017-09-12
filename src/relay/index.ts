import 'isomorphic-fetch';
import {StandardRelayerApi, SignedOrder} from '../types';

export class Relay {
    private url: string;
    private version: number;
    constructor(url: string) {
        this.url = url;
        this.version = 0;
    }
    public async getTokenPairsAsync(): Promise<StandardRelayerApi.RelayerApiTokenTradeInfo[]> {
        const tokenPairs = await this._requestAsync('token_pairs', 'GET');
        return tokenPairs;
    }
    public async getOrderAsync(orderHash: string): Promise<StandardRelayerApi.RelayerApiOrderResponse> {
        const order = await this._requestAsync(`order/${orderHash}`, 'GET');
        return order;
    }
    public async getOrdersAsync(): Promise<StandardRelayerApi.RelayerApiOrderResponse[]> {
        const orders = await this._requestAsync(`orders`, 'GET');
        return orders;
    }
    public async getFeesAsync(params: StandardRelayerApi.RelayerApiFeesRequest)
    : Promise<StandardRelayerApi.RelayerApiFeesResponse> {
        const fees = await this._requestAsync(`fees`, 'POST');
        return fees;
    }
    public async submitOrderAsync(signedOrder: SignedOrder)
    : Promise<void> {
        await this._requestAsync(`order`, 'POST');
    }
    private async _requestAsync(path: string, method: string): Promise<any> {
        const url = `${this.url}/v${this.version}/${path}`;
        const response = await fetch(url, {
            method,
        });
        const json = await response.json();
        return json;
    }
}
