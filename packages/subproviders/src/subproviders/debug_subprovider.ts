import { BigNumber } from '@0x/utils';
import { JSONRPCRequestPayload } from 'ethereum-types';
import EthereumTx = require('ethereumjs-tx');

import { Callback, ErrorCallback } from '../types';

import { Subprovider } from './subprovider';

const HEX_BASE = 16;

export interface DebugPayloadRawTransactionAttributes {
    gasPrice: BigNumber;
    gasLimit: BigNumber;
    nonce: BigNumber;
    value: BigNumber;
    to: string;
}
export interface DebugPayload extends JSONRPCRequestPayload {
    rawTransactionAttributes?: DebugPayloadRawTransactionAttributes;
}

export type WithDebugPayload = (debugPayload: DebugPayload) => void;
// tslint:disable-next-line:no-console
const defaultDebugCallback = (debugPayload: DebugPayload) => console.debug(debugPayload);

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * For every request, a object for debugging will be sent to the function specified in the constructor
 * Useful for debugging RPC requests which are not expecting as you expect.
 */
export class DebugSubprovider extends Subprovider {
    private readonly _debugCallback: WithDebugPayload;

    private static _generateRawTransactionAttributes(txn: EthereumTx): DebugPayloadRawTransactionAttributes {
        const hexBufferToBN = (value: Buffer) => new BigNumber(value.toString('hex'), HEX_BASE);

        return {
            gasLimit: hexBufferToBN(txn.gasLimit),
            gasPrice: hexBufferToBN(txn.gasPrice),
            nonce: hexBufferToBN(txn.nonce),
            value: hexBufferToBN(txn.value),
            to: `0x${txn.to.toString('hex')}`,
        };
    }

    public constructor(debugCallback: WithDebugPayload = defaultDebugCallback) {
        super();
        this._debugCallback = debugCallback;
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
        const debugPayload: DebugPayload = payload;
        if (payload.method === 'eth_sendRawTransaction' && payload.params[0]) {
            const txn = new EthereumTx(payload.params[0]);
            debugPayload.rawTransactionAttributes = DebugSubprovider._generateRawTransactionAttributes(txn);
        }
        this._debugCallback(debugPayload);

        next();
    }
}
