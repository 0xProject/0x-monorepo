import * as Web3 from 'web3';

import { Callback, ErrorCallback } from '../types';

import { Subprovider } from './subprovider';

// HACK: We need this so that our tests don't use testrpc gas estimation which sometimes kills the node.
// Source: https://github.com/trufflesuite/ganache-cli/issues/417
// Source: https://github.com/trufflesuite/ganache-cli/issues/437
// Source: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It intercepts the `eth_estimateGas` JSON RPC call and always returns a constant gas amount when queried.
 */
export class FakeGasEstimateSubprovider extends Subprovider {
    private _constantGasAmount: number;
    /**
     * Instantiates an instance of the FakeGasEstimateSubprovider
     * @param constantGasAmount The constant gas amount you want returned
     */
    constructor(constantGasAmount: number) {
        super();
        this._constantGasAmount = constantGasAmount;
    }
    // This method must conform to the web3-provider-engine interface
    // tslint:disable-next-line:prefer-function-over-method underscore-private-and-protected
    private handleRequest(payload: Web3.JSONRPCRequestPayload, next: Callback, end: ErrorCallback) {
        switch (payload.method) {
            case 'eth_estimateGas':
                end(null, this._constantGasAmount);
                return;

            default:
                next();
                return;
        }
    }
}
