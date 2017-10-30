import * as _ from 'lodash';
import {ZeroEx} from '../';
import {assert} from '../utils/assert';
import {Web3Provider, SignedOrder, OnOrderFillabilityStateChangeCallback} from '../types';
import {Web3Wrapper} from '../web3_wrapper';

export class OrderWatcher {
    private _orders = new Map<string, SignedOrder>();
    private _web3Wrapper: Web3Wrapper;
    constructor(provider: Web3Provider) {
        assert.isWeb3Provider('provider', provider);
        this._web3Wrapper = new Web3Wrapper(provider);
    }
    public addOrder(signedOrder: SignedOrder): void {
        const orderHash = ZeroEx.getOrderHashHex(signedOrder);
        this._orders.set(orderHash, signedOrder);
    }
    public removeOrder(signedOrder: SignedOrder): void {
        const orderHash = ZeroEx.getOrderHashHex(signedOrder);
        this._orders.delete(orderHash);
    }
    public subscribe(callback: OnOrderFillabilityStateChangeCallback): void {
        //
    }
    public unsubscribe(): void {
        //
    }
}
