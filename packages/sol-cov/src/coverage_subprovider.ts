import { Callback, NextCallback, Subprovider } from '@0xproject/subproviders';
import { promisify } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { constants } from './constants';
import { CoverageManager } from './coverage_manager';

/*
 * This class implements the web3-provider-engine subprovider interface and collects traces of all transactions that were sent and all calls that were executed.
 * Source: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class CoverageSubprovider extends Subprovider {
    private _coverageManager: CoverageManager;
    constructor(artifactsPath: string, sourcesPath: string, networkId: number) {
        super();
        this._coverageManager = new CoverageManager(
            artifactsPath,
            sourcesPath,
            networkId,
            this._getContractCodeAsync.bind(this),
        );
    }
    public handleRequest(
        payload: Web3.JSONRPCRequestPayload,
        next: NextCallback,
        end: (err: Error | null, result: any) => void,
    ) {
        switch (payload.method) {
            case 'eth_sendTransaction':
                const txData = payload.params[0];
                next(this._onTransactionSentAsync.bind(this, txData));
                return;

            case 'eth_call':
                const callData = payload.params[0];
                const blockNumber = payload.params[1];
                next(this._onCallExecutedAsync.bind(this, callData, blockNumber));
                return;

            default:
                next();
                return;
        }
    }
    public async writeCoverageAsync(): Promise<void> {
        await this._coverageManager.writeCoverageAsync();
    }
    private async _onTransactionSentAsync(
        txData: Web3.TxData,
        err: Error | null,
        txHash?: string,
        cb?: Callback,
    ): Promise<void> {
        if (_.isNull(err)) {
            await this._recordTxTraceAsync(txData.to || constants.NEW_CONTRACT, txData.data, txHash as string);
        } else {
            const payload = {
                method: 'eth_getBlockByNumber',
                params: ['latest', true],
            };
            const jsonRPCResponsePayload = await this.emitPayloadAsync(payload);
            const transactions = jsonRPCResponsePayload.result.transactions;
            for (const transaction of transactions) {
                await this._recordTxTraceAsync(
                    transaction.to || constants.NEW_CONTRACT,
                    transaction.data,
                    transaction.hash,
                );
            }
        }
        if (!_.isUndefined(cb)) {
            cb();
        }
    }
    private async _onCallExecutedAsync(
        callData: Partial<Web3.CallData>,
        blockNumber: Web3.BlockParam,
        err: Error | null,
        callResult: string,
        cb: Callback,
    ): Promise<void> {
        await this._recordCallTraceAsync(callData, blockNumber);
        cb();
    }
    private async _recordTxTraceAsync(address: string, data: string | undefined, txHash: string): Promise<void> {
        this._coverageManager.setTxDataByHash(txHash, data || '');
        const payload = {
            method: 'debug_traceTransaction',
            params: [txHash, { disableMemory: true, disableStack: true, disableStorage: true }], // TODO For now testrpc just ignores those parameters https://github.com/trufflesuite/ganache-cli/issues/489
        };
        const jsonRPCResponsePayload = await this.emitPayloadAsync(payload);
        const trace: Web3.TransactionTrace = jsonRPCResponsePayload.result;
        const coveredPcs = _.map(trace.structLogs, log => log.pc);
        this._coverageManager.appendTraceInfo(address, { coveredPcs, txHash });
    }
    private async _recordCallTraceAsync(callData: Partial<Web3.CallData>, blockNumber: Web3.BlockParam): Promise<void> {
        const snapshotId = Number((await this.emitPayloadAsync({ method: 'evm_snapshot' })).result);
        const txData = callData;
        if (_.isUndefined(txData.from)) {
            txData.from = '0x5409ed021d9299bf6814279a6a1411a7e866a631'; // TODO
        }
        const txDataWithFromAddress = txData as Web3.TxData & { from: string };
        try {
            const txHash = (await this.emitPayloadAsync({
                method: 'eth_sendTransaction',
                params: [txDataWithFromAddress],
            })).result;
            await this._onTransactionSentAsync(txDataWithFromAddress, null, txHash);
        } catch (err) {
            await this._onTransactionSentAsync(txDataWithFromAddress, err, undefined);
        }
        const didRevert = (await this.emitPayloadAsync({ method: 'evm_revert', params: [snapshotId] })).result;
    }
    private async _getContractCodeAsync(address: string): Promise<string> {
        const payload = {
            method: 'eth_getCode',
            params: [address, 'latest'],
        };
        const jsonRPCResponsePayload = await this.emitPayloadAsync(payload);
        const contractCode: string = jsonRPCResponsePayload.result;
        return contractCode;
    }
}
