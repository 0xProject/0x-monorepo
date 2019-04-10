import { promisify } from '@0x/utils';
import { JSONRPCRequestPayload } from 'ethereum-types';

import { Callback } from '../types';

import { Subprovider } from './subprovider';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It attempts to handle each JSON RPC request by sequentially attempting to receive a valid response from one of a
 * set of JSON RPC endpoints.
 */
export class RedundantSubprovider extends Subprovider {
    private readonly _subproviders: Subprovider[];
    private static async _firstSuccessAsync(
        subproviders: Subprovider[],
        payload: JSONRPCRequestPayload,
        next: Callback,
    ): Promise<any> {
        let lastErr: Error | undefined;
        for (const subprovider of subproviders) {
            try {
                const data = await promisify(subprovider.handleRequest.bind(subprovider))(payload, next);
                return data;
            } catch (err) {
                lastErr = err;
                continue;
            }
        }
        if (lastErr !== undefined) {
            throw lastErr;
        }
    }
    /**
     * Instantiates a new RedundantSubprovider
     * @param subproviders Subproviders to attempt the request with
     */
    constructor(subproviders: Subprovider[]) {
        super();
        this._subproviders = subproviders;
    }
    /**
     * This method conforms to the web3-provider-engine interface.
     * It is called internally by the ProviderEngine when it is this subproviders
     * turn to handle a JSON RPC request.
     * @param payload JSON RPC payload
     * @param next Callback to call if this subprovider decides not to handle the request
     * @param end Callback to call if subprovider handled the request and wants to pass back the request.
     */
    // tslint:disable-next-line:async-suffix
    public async handleRequest(
        payload: JSONRPCRequestPayload,
        next: Callback,
        end: (err: Error | null, data?: any) => void,
    ): Promise<void> {
        const subprovidersCopy = this._subproviders.slice();
        try {
            const data = await RedundantSubprovider._firstSuccessAsync(subprovidersCopy, payload, next);
            end(null, data);
        } catch (err) {
            end(err);
        }
    }
}
