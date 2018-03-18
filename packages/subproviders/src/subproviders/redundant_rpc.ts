import { promisify } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { Subprovider } from './subprovider';

export class RedundantRPCSubprovider extends Subprovider {
    private _rpcs: RpcSubprovider[];
    private static async _firstSuccessAsync(
        rpcs: RpcSubprovider[],
        payload: Web3.JSONRPCRequestPayload,
        next: () => void,
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
    constructor(endpoints: string[]) {
        super();
        this._rpcs = _.map(endpoints, endpoint => {
            return new RpcSubprovider({
                rpcUrl: endpoint,
            });
        });
    }
    // Required to implement this public interface which doesn't conform to our linting rule.
    // tslint:disable-next-line:async-suffix
    public async handleRequest(
        payload: Web3.JSONRPCRequestPayload,
        next: () => void,
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
