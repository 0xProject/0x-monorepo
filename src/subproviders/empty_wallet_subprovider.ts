import * as _ from 'lodash';
import Web3 = require('web3');

/*
 * This class implements the web3-provider-engine subprovider interface and returns
 * that the provider has no addresses when queried.
 * Source: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class EmptyWalletSubProvider {
    public handleRequest(payload: any, next: () => void, end: (err: Error|null, result: any) => void) {
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
    public setEngine(engine: any) {
        // noop
    }
}
