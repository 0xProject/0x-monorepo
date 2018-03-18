import * as Web3 from 'web3';

import { Subprovider } from './subprovider';

/*
 * This class implements the web3-provider-engine subprovider interface and returns
 * the constant gas estimate when queried.
 * HACK: We need this so that our tests don't use testrpc gas estimation which sometimes kills the node.
 * Source: https://github.com/trufflesuite/ganache-cli/issues/417
 * Source: https://github.com/trufflesuite/ganache-cli/issues/437
 * Source: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class FakeGasEstimateSubprovider extends Subprovider {
    private _constantGasAmount: number;
    constructor(constantGasAmount: number) {
        super();
        this._constantGasAmount = constantGasAmount;
    }
    // This method needs to be here to satisfy the interface but linter wants it to be static.
    // tslint:disable-next-line:prefer-function-over-method
    public handleRequest(
        payload: Web3.JSONRPCRequestPayload,
        next: () => void,
        end: (err: Error | null, result: any) => void,
    ) {
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
