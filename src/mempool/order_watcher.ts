import * as Web3 from 'web3';
import * as _ from 'lodash';
import {Web3Provider, SignedOrder} from '../types';
import {Web3Wrapper} from '../web3_wrapper';

export class OrderWatcher {
    constructor(provider: Web3Provider) {
        if (_.isUndefined((provider as any).sendAsync)) {
            // Web3@1.0 provider doesn't support synchronous http requests,
            // so it only has an async `send` method, instead of a `send` and `sendAsync` in web3@0.x.x`
            // We re-assign the send method so that Web3@1.0 providers work with 0x.js
            (provider as any).sendAsync = (provider as any).send;
        }
    }
    public addOrder(signedOrder: SignedOrder): void {
        //
    }
    public removeOrder(signedOrder: SignedOrder): void {
        //
    }
    public subscribe(callback: OnOrderFillabilityStateChangeCallback): void {
        //
    }
    public unsubscribe(): void {
        //
    }
}
