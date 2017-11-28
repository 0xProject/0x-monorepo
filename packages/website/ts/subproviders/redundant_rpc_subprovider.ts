import promisify = require('es6-promisify');
import * as _ from 'lodash';
import {JSONRPCPayload} from 'ts/types';
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');
import Subprovider = require('web3-provider-engine/subproviders/subprovider');

export class RedundantRPCSubprovider extends Subprovider {
    private rpcs: RpcSubprovider[];
    private static async firstSuccessAsync(
        rpcs: RpcSubprovider[], payload: JSONRPCPayload, next: () => void,
    ): Promise<any> {
        let lastErr;
        for (const rpc of rpcs) {
            try {
                const data = await promisify(rpc.handleRequest.bind(rpc))(payload, next);
                return data;
            } catch (err) {
                lastErr = err;
                continue;
            }
        }
        throw Error(lastErr);
    }
    constructor(endpoints: string[]) {
        super();
        this.rpcs = _.map(endpoints, endpoint => {
            return new RpcSubprovider({
                rpcUrl: endpoint,
            });
        });
    }
    public async handleRequest(payload: JSONRPCPayload, next: () => void,
                               end: (err?: Error, data?: any) =>  void): Promise<void> {
        const rpcsCopy = this.rpcs.slice();
        try {
            const data = await RedundantRPCSubprovider.firstSuccessAsync(rpcsCopy, payload, next);
            end(null, data);
        } catch (err) {
            end(err);
        }

    }
}
