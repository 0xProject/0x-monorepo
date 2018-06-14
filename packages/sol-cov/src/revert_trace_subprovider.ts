import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { Callback, ErrorCallback, NextCallback, Subprovider } from '@0xproject/subproviders';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { CallData, JSONRPCRequestPayload, Provider, TxData } from 'ethereum-types';
import { stripHexPrefix } from 'ethereumjs-util';
import * as _ from 'lodash';
import { getLogger, levels, Logger } from 'loglevel';
import { Lock } from 'semaphore-async-await';

import { AbstractArtifactAdapter } from './artifact_adapters/abstract_artifact_adapter';
import { constants } from './constants';
import { getRevertTrace } from './revert_trace';
import { parseSourceMap } from './source_maps';
import { BlockParamLiteral, ContractData, EvmCallStack, SourceRange } from './types';
import { utils } from './utils';

interface MaybeFakeTxData extends TxData {
    isFakeTransaction?: boolean;
}

const BLOCK_GAS_LIMIT = 6000000;

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It is used to report call stack traces whenever a revert occurs.
 */
export class RevertTraceSubprovider extends Subprovider {
    // Lock is used to not accept normal transactions while doing call/snapshot magic because they'll be reverted later otherwise
    private _lock = new Lock();
    private _defaultFromAddress: string;
    private _web3Wrapper!: Web3Wrapper;
    private _isEnabled = true;
    private _artifactAdapter: AbstractArtifactAdapter;
    private _contractsData!: ContractData[];
    private _logger: Logger;

    /**
     * Instantiates a TraceCollectionSubprovider instance
     * @param defaultFromAddress default from address to use when sending transactions
     */
    constructor(artifactAdapter: AbstractArtifactAdapter, defaultFromAddress: string, isVerbose: boolean) {
        super();
        this._artifactAdapter = artifactAdapter;
        this._defaultFromAddress = defaultFromAddress;
        this._logger = getLogger('sol-cov');
        this._logger.setLevel(isVerbose ? levels.TRACE : levels.ERROR);
    }
    /**
     * Starts trace collection
     */
    public start(): void {
        this._isEnabled = true;
    }
    /**
     * Stops trace collection
     */
    public stop(): void {
        this._isEnabled = false;
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
    public async handleRequest(payload: JSONRPCRequestPayload, next: NextCallback, _end: ErrorCallback): Promise<void> {
        if (this._isEnabled) {
            switch (payload.method) {
                case 'eth_sendTransaction':
                    const txData = payload.params[0];
                    next(this._onTransactionSentAsync.bind(this, txData));
                    return;

                case 'eth_call':
                    const callData = payload.params[0];
                    next(this._onCallOrGasEstimateExecutedAsync.bind(this, callData));
                    return;

                case 'eth_estimateGas':
                    const estimateGasData = payload.params[0];
                    next(this._onCallOrGasEstimateExecutedAsync.bind(this, estimateGasData));
                    return;

                default:
                    next();
                    return;
            }
        } else {
            next();
            return;
        }
    }
    /**
     * Set's the subprovider's engine to the ProviderEngine it is added to.
     * This is only called within the ProviderEngine source code, do not call
     * directly.
     */
    public setEngine(engine: Provider): void {
        super.setEngine(engine);
        this._web3Wrapper = new Web3Wrapper(engine);
    }
    private async _onTransactionSentAsync(
        txData: MaybeFakeTxData,
        err: Error | null,
        txHash: string | undefined,
        cb: Callback,
    ): Promise<void> {
        if (!txData.isFakeTransaction) {
            // This transaction is a usual transaction. Not a call executed as one.
            // And we don't want it to be executed within a snapshotting period
            await this._lock.acquire();
        }
        const NULL_ADDRESS = '0x0';
        if (_.isNull(err)) {
            const toAddress =
                _.isUndefined(txData.to) || txData.to === NULL_ADDRESS ? constants.NEW_CONTRACT : txData.to;
            await this._recordTxTraceAsync(toAddress, txData.data, txHash as string);
        } else {
            const latestBlock = await this._web3Wrapper.getBlockWithTransactionDataAsync(BlockParamLiteral.Latest);
            const transactions = latestBlock.transactions;
            for (const transaction of transactions) {
                const toAddress =
                    _.isUndefined(txData.to) || txData.to === NULL_ADDRESS ? constants.NEW_CONTRACT : txData.to;
                await this._recordTxTraceAsync(toAddress, transaction.input, transaction.hash);
            }
        }
        if (!txData.isFakeTransaction) {
            // This transaction is a usual transaction. Not a call executed as one.
            // And we don't want it to be executed within a snapshotting period
            this._lock.release();
        }
        cb();
    }
    private async _onCallOrGasEstimateExecutedAsync(
        callData: Partial<CallData>,
        _err: Error | null,
        _callResult: string,
        cb: Callback,
    ): Promise<void> {
        await this._recordCallOrGasEstimateTraceAsync(callData);
        cb();
    }
    private async _recordTxTraceAsync(address: string, data: string | undefined, txHash: string): Promise<void> {
        await this._web3Wrapper.awaitTransactionMinedAsync(txHash, 0);
        const trace = await this._web3Wrapper.getTransactionTraceAsync(txHash, {
            disableMemory: true,
            disableStack: false,
            disableStorage: true,
        });
        const evmCallStack = getRevertTrace(trace.structLogs, address);
        if (evmCallStack.length > 0) {
            // if getRevertTrace returns a call stack it means there was a
            // revert.
            await this._printStackTraceAsync(evmCallStack);
        }
    }
    private async _recordCallOrGasEstimateTraceAsync(callData: Partial<CallData>): Promise<void> {
        // We don't want other transactions to be exeucted during snashotting period, that's why we lock the
        // transaction execution for all transactions except our fake ones.
        await this._lock.acquire();
        const blockchainLifecycle = new BlockchainLifecycle(this._web3Wrapper);
        await blockchainLifecycle.startAsync();
        const fakeTxData: MaybeFakeTxData = {
            gas: BLOCK_GAS_LIMIT,
            isFakeTransaction: true, // This transaction (and only it) is allowed to come through when the lock is locked
            ...callData,
            from: callData.from || this._defaultFromAddress,
        };
        try {
            const txHash = await this._web3Wrapper.sendTransactionAsync(fakeTxData);
            await this._web3Wrapper.awaitTransactionMinedAsync(txHash, 0);
        } catch (err) {
            // Even if this transaction failed - we've already recorded it's trace.
            _.noop();
        }
        await blockchainLifecycle.revertAsync();
        this._lock.release();
    }
    private async _printStackTraceAsync(evmCallStack: EvmCallStack): Promise<void> {
        const sourceRanges: SourceRange[] = [];
        if (_.isUndefined(this._contractsData)) {
            this._contractsData = await this._artifactAdapter.collectContractsDataAsync();
        }
        for (const evmCallStackEntry of evmCallStack) {
            const isContractCreation = evmCallStackEntry.address === constants.NEW_CONTRACT;
            if (isContractCreation) {
                this._logger.error('Contract creation not supported');
                continue;
            }
            const bytecode = await this._web3Wrapper.getContractCodeAsync(evmCallStackEntry.address);
            const contractData = utils.getContractDataIfExists(this._contractsData, bytecode);
            if (_.isUndefined(contractData)) {
                const errMsg = isContractCreation
                    ? `Unknown contract creation transaction`
                    : `Transaction to an unknown address: ${evmCallStackEntry.address}`;
                this._logger.warn(errMsg);
                continue;
            }
            const bytecodeHex = stripHexPrefix(bytecode);
            const sourceMap = isContractCreation ? contractData.sourceMap : contractData.sourceMapRuntime;
            const pcToSourceRange = parseSourceMap(
                contractData.sourceCodes,
                sourceMap,
                bytecodeHex,
                contractData.sources,
            );
            // tslint:disable-next-line:no-unnecessary-initializer
            let sourceRange: SourceRange | undefined = undefined;
            let pc = evmCallStackEntry.structLog.pc;
            // Sometimes there is not a mapping for this pc (e.g. if the revert
            // actually happens in assembly). In that case, we want to keep
            // searching backwards by decrementing the pc until we find a
            // mapped source range.
            while (_.isUndefined(sourceRange)) {
                sourceRange = pcToSourceRange[pc];
                pc -= 1;
                if (pc <= 0) {
                    this._logger.warn(
                        `could not find matching sourceRange for structLog: ${evmCallStackEntry.structLog}`,
                    );
                    continue;
                }
            }
            sourceRanges.push(sourceRange);
        }
        if (sourceRanges.length > 0) {
            this._logger.error('\n\nStack trace for REVERT:\n');
            _.forEach(sourceRanges, sourceRange => {
                this._logger.error(
                    `${sourceRange.fileName}:${sourceRange.location.start.line}:${sourceRange.location.start.column}`,
                );
            });
            this._logger.error('\n');
        } else {
            this._logger.error('Could not determine stack trace');
        }
    }
}
