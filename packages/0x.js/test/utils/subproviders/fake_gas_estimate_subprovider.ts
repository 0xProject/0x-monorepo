import { JSONRPCPayload } from '../../../src/types';

/*
 * This class implements the web3-provider-engine subprovider interface and returns
 * the constant gas estimate when queried.
 * HACK: We need this so that our tests don't use testrpc gas estimation which sometimes kills the node.
 * Source: https://github.com/trufflesuite/ganache-cli/issues/417
 * Source: https://github.com/trufflesuite/ganache-cli/issues/437
 * Source: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class FakeGasEstimateSubprovider {
    private _constantGasAmount: number;
    constructor(constantGasAmount: number) {
        this._constantGasAmount = constantGasAmount;
    }
    // This method needs to be here to satisfy the interface but linter wants it to be static.
    // tslint:disable-next-line:prefer-function-over-method
    public handleRequest(payload: JSONRPCPayload, next: () => void, end: (err: Error | null, result: any) => void) {
        switch (payload.method) {
            case 'eth_estimateGas':
                end(null, this._constantGasAmount);
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
