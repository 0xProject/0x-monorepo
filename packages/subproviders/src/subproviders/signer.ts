import { marshaller, Web3Wrapper } from '@0x/web3-wrapper';
import { JSONRPCRequestPayload, SupportedProvider } from 'ethereum-types';

import { Callback, ErrorCallback } from '../types';

import { Subprovider } from './subprovider';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine)
 * subprovider interface. It forwards JSON RPC requests involving the domain of a signer (getAccounts,
 * sendTransaction, signMessage etc...) to the provider instance supplied at instantiation. All other requests
 * are passed onwards for subsequent subproviders to handle.
 */
export class SignerSubprovider extends Subprovider {
    private readonly _web3Wrapper: Web3Wrapper;
    /**
     * Instantiates a new SignerSubprovider.
     * @param supportedProvider Web3 provider that should handle  all user account related requests
     */
    constructor(supportedProvider: SupportedProvider) {
        super();
        this._web3Wrapper = new Web3Wrapper(supportedProvider);
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
        let message;
        let address;
        switch (payload.method) {
            case 'web3_clientVersion':
                try {
                    const nodeVersion = await this._web3Wrapper.getNodeVersionAsync();
                    end(null, nodeVersion);
                } catch (err) {
                    end(err);
                }
                return;
            case 'eth_accounts':
                try {
                    const accounts = await this._web3Wrapper.getAvailableAddressesAsync();
                    end(null, accounts);
                } catch (err) {
                    end(err);
                }
                return;
            case 'eth_sendTransaction':
                const [txParams] = payload.params;
                try {
                    const txData = marshaller.unmarshalTxData(txParams);
                    const txHash = await this._web3Wrapper.sendTransactionAsync(txData);
                    end(null, txHash);
                } catch (err) {
                    end(err);
                }
                return;
            case 'eth_sign':
                [address, message] = payload.params;
                try {
                    const signature = await this._web3Wrapper.signMessageAsync(address, message);
                    end(null, signature);
                } catch (err) {
                    end(err);
                }
                return;
            case 'eth_signTypedData':
                [address, message] = payload.params;
                try {
                    const signature = await this._web3Wrapper.signTypedDataAsync(address, message);
                    end(null, signature);
                } catch (err) {
                    end(err);
                }
                return;
            default:
                next();
                return;
        }
    }
}
