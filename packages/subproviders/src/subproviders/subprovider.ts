import promisify = require('es6-promisify');
import Web3 = require('web3');

import {
    JSONRPCPayload,
} from '../types';
/*
 * A version of the base class Subprovider found in providerEngine
 * This one has an async/await `emitPayloadAsync` and also defined types.
 * Altered version of: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class Subprovider {
    private engine: any;
    // Ported from: https://github.com/MetaMask/provider-engine/blob/master/util/random-id.js
    private static getRandomId() {
        const extraDigits = 3;
        // 13 time digits
        const datePart = new Date().getTime() * Math.pow(10, extraDigits);
        // 3 random digits
        const extraPart = Math.floor(Math.random() * Math.pow(10, extraDigits));
        // 16 digits
        return datePart + extraPart;
    }
    private static createFinalPayload(payload: JSONRPCPayload): Web3.JSONRPCRequestPayload {
        const finalPayload = {
            // defaults
            id: Subprovider.getRandomId(),
            jsonrpc: '2.0',
            params: [],
            ...payload,
        };
        return finalPayload;
    }
    public setEngine(engine: any): void {
        this.engine = engine;
    }
    public async emitPayloadAsync(payload: JSONRPCPayload): Promise<any> {
        const finalPayload = Subprovider.createFinalPayload(payload);
        const response = await promisify(this.engine.sendAsync, this.engine)(finalPayload);
        return response;
    }
}
