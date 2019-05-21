import { JSONRPCRequestPayload } from 'ethereum-types';

import { Callback, ErrorCallback } from './types';

import { Subprovider } from './subprovider';

/**
 * This is duplicated from Subproviders
 */
export class EmptyWalletSubprovider extends Subprovider {
    // tslint:disable-next-line:prefer-function-over-method async-suffix
    public async handleRequest(payload: JSONRPCRequestPayload, next: Callback, end: ErrorCallback): Promise<void> {
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
