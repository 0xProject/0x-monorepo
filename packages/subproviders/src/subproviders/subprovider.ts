import promisify = require('es6-promisify');
import Web3 = require('web3');

import { JSONRPCPayload } from '../types';
/*
 * A version of the base class Subprovider found in providerEngine
 * This one has an async/await `emitPayloadAsync` and also defined types.
 * Altered version of: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class Subprovider {
    private _engine: any;
    // Ported from: https://github.com/MetaMask/provider-engine/blob/master/util/random-id.js
    private static _getRandomId() {
        const extraDigits = 3;
        // 13 time digits
        const datePart = new Date().getTime() * Math.pow(10, extraDigits);
        // 3 random digits
        const extraPart = Math.floor(Math.random() * Math.pow(10, extraDigits));
        // 16 digits
        return datePart + extraPart;
    }
    private static _createFinalPayload(payload: JSONRPCPayload): Web3.JSONRPCRequestPayload {
        const finalPayload = {
            // defaults
            id: Subprovider._getRandomId(),
            jsonrpc: '2.0',
            params: [],
            ...payload,
        };
        return finalPayload;
    }
    public setEngine(engine: any): void {
        this._engine = engine;
    }
    public async emitPayloadAsync(payload: JSONRPCPayload): Promise<any> {
        const finalPayload = Subprovider._createFinalPayload(payload);
        const response = await promisify(this._engine.sendAsync, this._engine)(finalPayload);
        return response;
    }
}
