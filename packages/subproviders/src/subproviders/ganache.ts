import * as Ganache from 'ganache-core';
import * as Web3 from 'web3';

import { Callback, ErrorCallback } from '../types';

import { Subprovider } from './subprovider';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It intercepts all JSON RPC requests and relays them to an in-process ganache instance.
 */
export class GanacheSubprovider extends Subprovider {
    private _ganacheProvider: Web3.Provider;
    /**
     * Instantiates a GanacheSubprovider
     * @param opts The desired opts with which to instantiate the Ganache provider
     */
    constructor(opts: any) {
        super();
        this._ganacheProvider = Ganache.provider(opts);
    }
    // This method must conform to the web3-provider-engine interface
    // tslint:disable-next-line:prefer-function-over-method underscore-private-and-protected
    private handleRequest(payload: Web3.JSONRPCRequestPayload, next: Callback, end: ErrorCallback) {
        this._ganacheProvider.sendAsync(payload, (err: Error | null, result: any) => {
            end(err, result && result.result);
        });
    }
}
