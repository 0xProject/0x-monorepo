import { Callback, ErrorCallback, NextCallback, Subprovider } from '@0xproject/subproviders';
import { BlockParam, CallData, JSONRPCRequestPayload, TransactionTrace, TxData } from '@0xproject/types';
import * as fs from 'fs';
import * as _ from 'lodash';
import { Lock } from 'semaphore-async-await';

import { AbstractArtifactAdapter } from './artifact_adapters/abstract';
import { constants } from './constants';
import { CoverageManager } from './coverage_manager';
import { getTracesByContractAddress } from './trace';
import { TraceInfoExistingContract, TraceInfoNewContract } from './types';

interface MaybeFakeTxData extends TxData {
    isFakeTransaction?: boolean;
}

// Because there is no notion of a call trace in the Ethereum rpc - we collect them in a rather non-obvious/hacky way.
// On each call - we create a snapshot, execute the call as a transaction, get the trace, revert the snapshot.
// That allows us to avoid influencing test behaviour.

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It collects traces of all transactions that were sent and all calls that were executed through JSON RPC.
 */
export class CoverageSubprovider extends Subprovider {
    // Lock is used to not accept normal transactions while doing call/snapshot magic because they'll be reverted later otherwise
    private _lock: Lock;
    private _coverageManager: CoverageManager;
    private _defaultFromAddress: string;
    /**
     * Instantiates a CoverageSubprovider instance
     * @param artifactAdapter Adapter for used artifacts format (0x, truffle, giveth, etc.)
     * @param defaultFromAddress default from address to use when sending transactions
     * @param verbose If true, we will log any unknown transactions. Otherwise we will ignore them
     */
    constructor(artifactAdapter: AbstractArtifactAdapter, defaultFromAddress: string, verbose: boolean = true) {
        super();
        this._lock = new Lock();
        this._defaultFromAddress = defaultFromAddress;
        this._coverageManager = new CoverageManager(artifactAdapter, this._getContractCodeAsync.bind(this), verbose);
    }
    /**
     * Write the test coverage results to a file in Istanbul format.
     */
    public async writeCoverageAsync(): Promise<void> {
        await this._coverageManager.writeCoverageAsync();
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
    public async handleRequest(payload: JSONRPCRequestPayload, next: NextCallback, end: ErrorCallback): Promise<void> {
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
    private async _onTransactionSentAsync(
        txData: MaybeFakeTxData,
        err: Error | null,
        txHash: string | undefined,
        cb: Callback,
    ): Promise<void> {
        if (!txData.isFakeTransaction) {
            // This transaction is a usual ttransaction. Not a call executed as one.
            // And we don't want it to be executed within a snapshotting period
            await this._lock.acquire();
        }
        if (_.isNull(err)) {
            const toAddress = _.isUndefined(txData.to) || txData.to === '0x0' ? constants.NEW_CONTRACT : txData.to;
            await this._recordTxTraceAsync(toAddress, txData.data, txHash as string);
        } else {
            const payload = {
                method: 'eth_getBlockByNumber',
                params: ['latest', true],
            };
            const jsonRPCResponsePayload = await this.emitPayloadAsync(payload);
            const transactions = jsonRPCResponsePayload.result.transactions;
            for (const transaction of transactions) {
                const toAddress = _.isUndefined(txData.to) || txData.to === '0x0' ? constants.NEW_CONTRACT : txData.to;
                await this._recordTxTraceAsync(toAddress, transaction.data, transaction.hash);
            }
        }
        if (!txData.isFakeTransaction) {
            // This transaction is a usual ttransaction. Not a call executed as one.
            // And we don't want it to be executed within a snapshotting period
            this._lock.release();
        }
        cb();
    }
    private async _onCallExecutedAsync(
        callData: Partial<CallData>,
        blockNumber: BlockParam,
        err: Error | null,
        callResult: string,
        cb: Callback,
    ): Promise<void> {
        await this._recordCallTraceAsync(callData, blockNumber);
        cb();
    }
    private async _recordTxTraceAsync(address: string, data: string | undefined, txHash: string): Promise<void> {
        let payload = {
            method: 'debug_traceTransaction',
            params: [txHash, { disableMemory: true, disableStack: false, disableStorage: true }],
        };
        const jsonRPCResponsePayload = await this.emitPayloadAsync(payload);
        const trace: TransactionTrace = jsonRPCResponsePayload.result;
        if (address === constants.NEW_CONTRACT) {
            // TODO handle calls to external contracts and contract creations from within the constructor
            const structLogsOnDepth0 = _.filter(trace.structLogs, { depth: 0 });
            const coveredPcs = _.map(structLogsOnDepth0, log => log.pc);
            const traceInfo: TraceInfoNewContract = {
                coveredPcs,
                txHash,
                address: address as 'NEW_CONTRACT',
                bytecode: data as string,
            };
            this._coverageManager.appendTraceInfo(traceInfo);
        } else {
            const tracesByContractAddress = getTracesByContractAddress(trace.structLogs, address);
            for (const subcallAddress of _.keys(tracesByContractAddress)) {
                payload = { method: 'eth_getCode', params: [subcallAddress, 'latest'] };
                const runtimeBytecode = (await this.emitPayloadAsync(payload)).result;
                const traceForThatSubcall = tracesByContractAddress[subcallAddress];
                const coveredPcs = _.map(traceForThatSubcall, log => log.pc);
                const traceInfo: TraceInfoExistingContract = {
                    coveredPcs,
                    txHash,
                    address: subcallAddress,
                    runtimeBytecode,
                };
                this._coverageManager.appendTraceInfo(traceInfo);
            }
        }
    }
    private async _recordCallTraceAsync(callData: Partial<CallData>, blockNumber: BlockParam): Promise<void> {
        // We don't want other transactions to be exeucted during snashotting period, that's why we lock the
        // transaction execution for all transactions except our fake ones.
        await this._lock.acquire();
        const snapshotId = Number((await this.emitPayloadAsync({ method: 'evm_snapshot' })).result);
        const fakeTxData: MaybeFakeTxData = {
            isFakeTransaction: true, // This transaction (and only it) is allowed to come through when the lock is locked
            ...callData,
            from: callData.from || this._defaultFromAddress,
        };
        try {
            await this.emitPayloadAsync({
                method: 'eth_sendTransaction',
                params: [fakeTxData],
            });
        } catch (err) {
            // Even if this transaction failed - we've already recorded it's trace.
        }
        const jsonRPCResponse = await this.emitPayloadAsync({ method: 'evm_revert', params: [snapshotId] });
        this._lock.release();
        const didRevert = jsonRPCResponse.result;
        if (!didRevert) {
            throw new Error('Failed to revert the snapshot');
        }
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
