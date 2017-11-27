import * as _ from 'lodash';
import Web3 = require('web3');
import {constants} from 'ts/utils/constants';

/*
 * This class implements the web3-provider-engine subprovider interface and forwards
 * requests involving user accounts (getAccounts, sendTransaction, etc...) to the injected
 * web3 instance in their browser.
 * Source: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class InjectedWeb3SubProvider {
    private injectedWeb3: Web3;
    constructor(injectedWeb3: Web3) {
        this.injectedWeb3 = injectedWeb3;
    }
    public handleRequest(payload: any, next: () => void, end: (err: Error, result: any) => void) {
        switch (payload.method) {
            case 'web3_clientVersion':
                this.injectedWeb3.version.getNode(end);
                return;
            case 'eth_accounts':
                this.injectedWeb3.eth.getAccounts(end);
                return;

            case 'eth_sendTransaction':
                const [txParams] = payload.params;
                this.injectedWeb3.eth.sendTransaction(txParams, end);
                return;

            case 'eth_sign':
                const [address, message] = payload.params;
                this.injectedWeb3.eth.sign(address, message, end);
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
