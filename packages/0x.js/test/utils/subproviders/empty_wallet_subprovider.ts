import { JSONRPCPayload } from '../../../src/types';

/*
 * This class implements the web3-provider-engine subprovider interface and returns
 * that the provider has no addresses when queried.
 * Source: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class EmptyWalletSubprovider {
    // This method needs to be here to satisfy the interface but linter wants it to be static.
    // tslint:disable-next-line:prefer-function-over-method
    public handleRequest(payload: JSONRPCPayload, next: () => void, end: (err: Error | null, result: any) => void) {
        switch (payload.method) {
            case 'eth_accounts':
                end(null, []);
                return;

            default:
                next();
                return;
        }
    }
    // Required to implement this method despite not needing it for this subprovider
    // tslint:disable-next-line:prefer-function-over-method
    public setEngine(engine: any) {
        // noop
    }
}
