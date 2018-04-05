import { JSONRPCRequestPayload, JSONRPCResponsePayload } from '@0xproject/types';
import { addressUtils } from '@0xproject/utils';
import * as _ from 'lodash';

import { Callback, PartialTxParams, ResponseWithTxParams, WalletSubproviderErrors } from '../types';

import { Subprovider } from './subprovider';

export abstract class BaseWalletSubprovider extends Subprovider {
    protected static _validateSender(sender: string) {
        if (_.isUndefined(sender) || !addressUtils.isAddress(sender)) {
            throw new Error(WalletSubproviderErrors.SenderInvalidOrNotSupplied);
        }
    }

    public abstract async getAccountsAsync(): Promise<string[]>;
    public abstract async signTransactionAsync(txParams: PartialTxParams): Promise<string>;
    public abstract async signPersonalMessageAsync(dataIfExists: string): Promise<string>;

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
        end: (err: Error | null, result?: any) => void,
    ) {
        let accounts;
        let txParams;
        switch (payload.method) {
            case 'eth_coinbase':
                try {
                    accounts = await this.getAccountsAsync();
                    end(null, accounts[0]);
                } catch (err) {
                    end(err);
                }
                return;

            case 'eth_accounts':
                try {
                    accounts = await this.getAccountsAsync();
                    end(null, accounts);
                } catch (err) {
                    end(err);
                }
                return;

            case 'eth_sendTransaction':
                txParams = payload.params[0];
                try {
                    BaseWalletSubprovider._validateSender(txParams.from);
                    const filledParams = await this._populateMissingTxParamsAsync(txParams);
                    const signedTx = await this.signTransactionAsync(filledParams);
                    const response = await this._emitSendTransactionAsync(signedTx);
                    end(null, response.result);
                } catch (err) {
                    end(err);
                }
                return;

            case 'eth_signTransaction':
                txParams = payload.params[0];
                try {
                    const filledParams = await this._populateMissingTxParamsAsync(txParams);
                    const signedTx = await this.signTransactionAsync(filledParams);
                    const result = {
                        raw: signedTx,
                        tx: txParams,
                    };
                    end(null, result);
                } catch (err) {
                    end(err);
                }
                return;

            case 'eth_sign':
            case 'personal_sign':
                const data = payload.method === 'eth_sign' ? payload.params[1] : payload.params[0];
                try {
                    const ecSignatureHex = await this.signPersonalMessageAsync(data);
                    end(null, ecSignatureHex);
                } catch (err) {
                    end(err);
                }
                return;

            default:
                next();
                return;
        }
    }
    private async _emitSendTransactionAsync(signedTx: string): Promise<JSONRPCResponsePayload> {
        const payload = {
            method: 'eth_sendRawTransaction',
            params: [signedTx],
        };
        const result = await this.emitPayloadAsync(payload);
        return result;
    }
    private async _populateMissingTxParamsAsync(txParams: PartialTxParams): Promise<PartialTxParams> {
        if (_.isUndefined(txParams.gasPrice)) {
            const gasPriceResult = await this.emitPayloadAsync({
                method: 'eth_gasPrice',
                params: [],
            });
            const gasPrice = gasPriceResult.result.toString();
            txParams.gasPrice = gasPrice;
        }
        if (_.isUndefined(txParams.nonce)) {
            const nonceResult = await this.emitPayloadAsync({
                method: 'eth_getTransactionCount',
                params: [txParams.from, 'pending'],
            });
            const nonce = nonceResult.result;
            txParams.nonce = nonce;
        }
        if (_.isUndefined(txParams.gas)) {
            const gasResult = await this.emitPayloadAsync({
                method: 'eth_estimateGas',
                params: [txParams],
            });
            const gas = gasResult.result.toString();
            txParams.gas = gas;
        }
        return txParams;
    }
}
