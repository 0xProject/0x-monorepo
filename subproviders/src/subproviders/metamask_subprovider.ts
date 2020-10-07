import { providerUtils } from '@0x/utils';
import { marshaller, Web3Wrapper } from '@0x/web3-wrapper';
import { JSONRPCRequestPayload, SupportedProvider, ZeroExProvider } from 'ethereum-types';

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
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _provider: ZeroExProvider;
    /**
     * Instantiates a new MetamaskSubprovider
     * @param supportedProvider Web3 provider that should handle  all user account related requests
     */
    constructor(supportedProvider: SupportedProvider) {
        super();
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this._web3Wrapper = new Web3Wrapper(provider);
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
                    // Metamask incorrectly implements eth_sign and does not prefix the message as per the spec
                    // It does however implement personal_sign and will leave off the prefix when used as a proxy for hardware wallets
                    // Source: https://metamask.github.io/metamask-docs/API_Reference/Signing_Data/Personal_Sign
                    // See: https://github.com/MetaMask/eth-ledger-bridge-keyring/blob/master/index.js#L192
                    // and https://github.com/MetaMask/eth-trezor-keyring/blob/master/index.js#L211
                    // and https://github.com/MetaMask/eth-sig-util/blob/master/index.js#L250
                    const signature = await this._web3Wrapper.sendRawPayloadAsync<string>({
                        method: 'personal_sign',
                        params: [message, address],
                    });
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
                    const signature = await this._web3Wrapper.sendRawPayloadAsync<string>({
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
