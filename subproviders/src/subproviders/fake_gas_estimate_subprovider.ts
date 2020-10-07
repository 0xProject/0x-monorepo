import { JSONRPCRequestPayload } from 'ethereum-types';

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
    private readonly _constantGasAmount: number;
    /**
     * Instantiates an instance of the FakeGasEstimateSubprovider
     * @param constantGasAmount The constant gas amount you want returned
     */
    constructor(constantGasAmount: number) {
        super();
        this._constantGasAmount = constantGasAmount;
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
            case 'eth_estimateGas':
                end(null, this._constantGasAmount);
                return;

            default:
                next();
                return;
        }
    }
}
