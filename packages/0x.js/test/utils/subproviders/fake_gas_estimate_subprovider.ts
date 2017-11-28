import {JSONRPCPayload} from '../../../src/types';

/*
 * This class implements the web3-provider-engine subprovider interface and returns
 * the constant gas estimate when queried.
 * Source: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class FakeGasEstimateProvider {
    private constantGasAmount: number;
    constructor(constantGasAmount: number) {
        this.constantGasAmount = constantGasAmount;
    }
    // This method needs to be here to satisfy the interface but linter wants it to be static.
    // tslint:disable-next-line:prefer-function-over-method
    public handleRequest(payload: JSONRPCPayload, next: () => void, end: (err: Error|null, result: any) => void) {
        switch (payload.method) {
            case 'eth_estimateGas':
                end(null, this.constantGasAmount);
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
