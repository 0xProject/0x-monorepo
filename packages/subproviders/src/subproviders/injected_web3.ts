import { JSONRPCRequestPayload, Provider } from '@0xproject/types';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { Callback, ErrorCallback } from '../types';

import { Subprovider } from './subprovider';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine)
 * subprovider interface. It forwards JSON RPC requests involving user accounts (getAccounts,
 * sendTransaction, etc...) to the provider instance supplied at instantiation. All other requests
 * are passed onwards for subsequent subproviders to handle.
 */
export class InjectedWeb3Subprovider extends Subprovider {
    private _injectedWeb3: Web3;
    /**
     * Instantiates a new InjectedWeb3Subprovider
     * @param provider Web3 provider that should handle  all user account related requests
     */
    constructor(provider: Provider) {
        super();
        this._injectedWeb3 = new Web3(provider);
    }
    /**
     * This method conforms to the web3-provider-engine interface.
     * It is called internally by the ProviderEngine when it is this subproviders
     * turn to handle a JSON RPC request.
     * @param payload JSON RPC payload
     * @param next Callback to call if this subprovider decides not to handle the request
     * @param end Callback to call if subprovider handled the request and wants to pass back the request.
     */
    // tslint:disable-next-line:prefer-function-over-method async-suffix
    public async handleRequest(payload: JSONRPCRequestPayload, next: Callback, end: ErrorCallback): Promise<void> {
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
