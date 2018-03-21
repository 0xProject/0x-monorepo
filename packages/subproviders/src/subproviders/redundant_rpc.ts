import { promisify } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { Callback } from '../types';

import { Subprovider } from './subprovider';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It attempts to handle each JSON RPC request by sequentially attempting to receive a valid response from one of a
 * set of JSON RPC endpoints.
 */
export class RedundantRPCSubprovider extends Subprovider {
    private _rpcs: RpcSubprovider[];
    private static async _firstSuccessAsync(
        rpcs: RpcSubprovider[],
        payload: Web3.JSONRPCRequestPayload,
        next: Callback,
    ): Promise<any> {
        let lastErr: Error | undefined;
        for (const rpc of rpcs) {
            try {
                const data = await promisify(rpc.handleRequest.bind(rpc))(payload, next);
                return data;
            } catch (err) {
                lastErr = err;
                continue;
            }
        }
        if (!_.isUndefined(lastErr)) {
            throw lastErr;
        }
    }
    /**
     * Instantiates a new RedundantRPCSubprovider
     * @param endpoints JSON RPC endpoints to attempt. Attempts are made in the order of the endpoints.
     */
    constructor(endpoints: string[]) {
        super();
        this._rpcs = _.map(endpoints, endpoint => {
            return new RpcSubprovider({
                rpcUrl: endpoint,
            });
        });
    }
    // This method must conform to the web3-provider-engine interface
    // tslint:disable-next-line:prefer-function-over-method underscore-private-and-protected
    private async handleRequest(
        payload: Web3.JSONRPCRequestPayload,
        next: Callback,
        end: (err: Error | null, data?: any) => void,
    ): Promise<void> {
        const rpcsCopy = this._rpcs.slice();
        try {
            const data = await RedundantRPCSubprovider._firstSuccessAsync(rpcsCopy, payload, next);
            end(null, data);
        } catch (err) {
            end(err);
        }
    }
}
