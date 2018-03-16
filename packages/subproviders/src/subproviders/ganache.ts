import * as Ganache from 'ganache-core';
import * as Web3 from 'web3';

import { Callback, ErrorCallback } from '../types';

import { Subprovider } from './subprovider';

/*
 * This class implements the web3-provider-engine subprovider interface and returns
 * the provider connected to a in-process ganache.
 * Source: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class GanacheSubprovider extends Subprovider {
    private _ganacheProvider: Web3.Provider;
    constructor(opts: any) {
        super();
        this._ganacheProvider = Ganache.provider(opts);
    }
    // This method needs to be here to satisfy the interface but linter wants it to be static.
    // tslint:disable-next-line:prefer-function-over-method
    public handleRequest(payload: Web3.JSONRPCRequestPayload, next: Callback, end: ErrorCallback) {
        this._ganacheProvider.sendAsync(payload, (err: Error | null, result: any) => {
            end(err, result && result.result);
        });
    }
}
