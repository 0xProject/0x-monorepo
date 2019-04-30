import { assert } from '@0x/assert';
import { addressUtils } from '@0x/utils';
import { JSONRPCRequestPayload, JSONRPCResponsePayload } from 'ethereum-types';
import * as _ from 'lodash';

import { Callback, ErrorCallback, PartialTxParams, WalletSubproviderErrors } from '../types';

import { Subprovider } from './subprovider';

export abstract class BaseWalletSubprovider extends Subprovider {
    protected static _validateTxParams(txParams: PartialTxParams): void {
        if (txParams.to !== undefined) {
            assert.isETHAddressHex('to', txParams.to);
        }
        assert.isHexString('nonce', txParams.nonce);
    }
    private static _validateSender(sender: string): void {
        if (sender === undefined || !addressUtils.isAddress(sender)) {
            throw new Error(WalletSubproviderErrors.SenderInvalidOrNotSupplied);
        }
    }

    public abstract async getAccountsAsync(): Promise<string[]>;
    public abstract async signTransactionAsync(txParams: PartialTxParams): Promise<string>;
    public abstract async signPersonalMessageAsync(data: string, address: string): Promise<string>;
    public abstract async signTypedDataAsync(address: string, typedData: any): Promise<string>;

    /**
     * This method conforms to the web3-provider-engine interface.
     * It is called internally by the ProviderEngine when it is this subproviders
     * turn to handle a JSON RPC request.
     * @param payload JSON RPC payload
     * @param next Callback to call if this subprovider decides not to handle the request
     * @param end Callback to call if subprovider handled the request and wants to pass back the request.
     */
    // tslint:disable-next-line:async-suffix
    public async handleRequest(payload: JSONRPCRequestPayload, next: Callback, end: ErrorCallback): Promise<void> {
        let accounts;
        let txParams;
        let address;
        let typedData;
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
                address = payload.method === 'eth_sign' ? payload.params[0] : payload.params[1];
                try {
                    const ecSignatureHex = await this.signPersonalMessageAsync(data, address);
                    end(null, ecSignatureHex);
                } catch (err) {
                    end(err);
                }
                return;
            case 'eth_signTypedData':
                [address, typedData] = payload.params;
                try {
                    const signature = await this.signTypedDataAsync(address, typedData);
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
    private async _emitSendTransactionAsync(signedTx: string): Promise<JSONRPCResponsePayload> {
        const payload = {
            method: 'eth_sendRawTransaction',
            params: [signedTx],
        };
        const result = await this.emitPayloadAsync(payload);
        return result;
    }
    private async _populateMissingTxParamsAsync(partialTxParams: PartialTxParams): Promise<PartialTxParams> {
        let txParams = partialTxParams;
        if (partialTxParams.gasPrice === undefined) {
            const gasPriceResult = await this.emitPayloadAsync({
                method: 'eth_gasPrice',
                params: [],
            });
            const gasPrice = gasPriceResult.result.toString();
            txParams = { ...txParams, gasPrice };
        }
        if (partialTxParams.nonce === undefined) {
            const nonceResult = await this.emitPayloadAsync({
                method: 'eth_getTransactionCount',
                params: [partialTxParams.from, 'pending'],
            });
            const nonce = nonceResult.result;
            txParams = { ...txParams, nonce };
        }
        if (partialTxParams.gas === undefined) {
            const gasResult = await this.emitPayloadAsync({
                method: 'eth_estimateGas',
                params: [partialTxParams],
            });
            const gas = gasResult.result.toString();
            txParams = { ...txParams, gas };
        }
        return txParams;
    }
}
