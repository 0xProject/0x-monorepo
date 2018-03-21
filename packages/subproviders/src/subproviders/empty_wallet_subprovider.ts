import * as Web3 from 'web3';

import { Callback, ErrorCallback } from '../types';

import { Subprovider } from './subprovider';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It intercepts the `eth_accounts` JSON RPC requests and never returns any addresses when queried.
 */
export class EmptyWalletSubprovider extends Subprovider {
    // This method needs to be here to satisfy the interface but linter wants it to be static.
    // tslint:disable-next-line:prefer-function-over-method underscore-private-and-protected
    private handleRequest(payload: Web3.JSONRPCRequestPayload, next: Callback, end: ErrorCallback) {
        switch (payload.method) {
            case 'eth_accounts':
                end(null, []);
                return;

            default:
                next();
                return;
        }
    }
}
