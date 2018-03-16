import * as _ from 'lodash';
import * as Web3 from 'web3';

import { Callback, ErrorCallback } from '../types';

import { Subprovider } from './subprovider';

/*
 * This class implements the web3-provider-engine subprovider interface and forwards
 * requests involving user accounts (getAccounts, sendTransaction, etc...) to the injected
 * provider instance in their browser.
 * Source: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class InjectedWeb3Subprovider extends Subprovider {
    private _injectedWeb3: Web3;
    constructor(subprovider: Web3.Provider) {
        super();
        this._injectedWeb3 = new Web3(subprovider);
    }
    public handleRequest(payload: Web3.JSONRPCRequestPayload, next: Callback, end: ErrorCallback) {
        switch (payload.method) {
            case 'web3_clientVersion':
                this._injectedWeb3.version.getNode(end);
                return;
            case 'eth_accounts':
                this._injectedWeb3.eth.getAccounts(end);
                return;

            case 'eth_sendTransaction':
                const [txParams] = payload.params;
                this._injectedWeb3.eth.sendTransaction(txParams, end);
                return;

            case 'eth_sign':
                const [address, message] = payload.params;
                this._injectedWeb3.eth.sign(address, message, end);
                return;

            default:
                next();
                return;
        }
    }
}
