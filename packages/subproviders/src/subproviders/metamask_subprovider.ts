import { marshaller, EthRPCClient } from '@0x/eth-rpc-client';
import { JSONRPCRequestPayload, Provider } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';

import { Callback, ErrorCallback } from '../types';

import { Subprovider } from './subprovider';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine)
 * subprovider interface and the provider sendAsync interface.
 * It handles inconsistencies with Metamask implementations of various JSON RPC methods.
 * It forwards JSON RPC requests involving the domain of a signer (getAccounts,
 * sendTransaction, signMessage etc...) to the provider instance supplied at instantiation. All other requests
 * are passed onwards for subsequent subproviders to handle.
 */
export class MetamaskSubprovider extends Subprovider {
    private readonly _ethRPCClient: EthRPCClient;
    private readonly _provider: Provider;
    /**
     * Instantiates a new MetamaskSubprovider
     * @param provider Web3 provider that should handle  all user account related requests
     */
    constructor(provider: Provider) {
        super();
        this._ethRPCClient = new EthRPCClient(provider);
        this._provider = provider;
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
                    const nodeVersion = await this._ethRPCClient.getNodeVersionAsync();
                    end(null, nodeVersion);
                } catch (err) {
                    end(err);
                }
                return;
            case 'eth_accounts':
                try {
                    const accounts = await this._ethRPCClient.getAvailableAddressesAsync();
                    end(null, accounts);
                } catch (err) {
                    end(err);
                }
                return;
            case 'eth_sendTransaction':
                const [txParams] = payload.params;
                try {
                    const txData = marshaller.unmarshalTxData(txParams);
                    const txHash = await this._ethRPCClient.sendTransactionAsync(txData);
                    end(null, txHash);
                } catch (err) {
                    end(err);
                }
                return;
            case 'eth_sign':
                [address, message] = payload.params;
                try {
                    // Metamask incorrectly implements eth_sign and does not prefix the message as per the spec
                    // Source: https://github.com/MetaMask/metamask-extension/commit/a9d36860bec424dcee8db043d3e7da6a5ff5672e
                    const msgBuff = ethUtil.toBuffer(message);
                    const prefixedMsgBuff = ethUtil.hashPersonalMessage(msgBuff);
                    const prefixedMsgHex = ethUtil.bufferToHex(prefixedMsgBuff);
                    const signature = await this._ethRPCClient.signMessageAsync(address, prefixedMsgHex);
                    signature ? end(null, signature) : end(new Error('Error performing eth_sign'), null);
                } catch (err) {
                    end(err);
                }
                return;
            case 'eth_signTypedData':
            case 'eth_signTypedData_v3':
                [address, message] = payload.params;
                try {
                    // Metamask supports multiple versions and has namespaced signTypedData to v3 for an indeterminate period of time.
                    // eth_signTypedData is mapped to an older implementation before the spec was finalized.
                    // Source: https://github.com/MetaMask/metamask-extension/blob/c49d854b55b3efd34c7fd0414b76f7feaa2eec7c/app/scripts/metamask-controller.js#L1262
                    // and expects message to be serialised as JSON
                    const messageJSON = JSON.stringify(message);
                    const signature = await this._ethRPCClient.sendRawPayloadAsync<string>({
                        method: 'eth_signTypedData_v3',
                        params: [address, messageJSON],
                    });
                    signature ? end(null, signature) : end(new Error('Error performing eth_signTypedData'), null);
                } catch (err) {
                    end(err);
                }
                return;
            default:
                next();
                return;
        }
    }
    /**
     * This method conforms to the provider sendAsync interface.
     * Allowing the MetamaskSubprovider to be used as a generic provider (outside of Web3ProviderEngine) with the
     * addition of wrapping the inconsistent Metamask behaviour
     * @param payload JSON RPC payload
     * @return The contents nested under the result key of the response body
     */
    public sendAsync(payload: JSONRPCRequestPayload, callback: ErrorCallback): void {
        void this.handleRequest(
            payload,
            // handleRequest has decided to not handle this, so fall through to the provider
            () => {
                const sendAsync = this._provider.sendAsync.bind(this._provider);
                sendAsync(payload, callback);
            },
            // handleRequest has called end and will handle this
            (err, data) => {
                err ? callback(err) : callback(null, { ...payload, result: data });
            },
        );
    }
}
