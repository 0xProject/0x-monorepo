import { BlockchainLifecycle } from '@0x/dev-utils';
import { Callback, ErrorCallback, NextCallback, Subprovider, Web3ProviderEngine } from '@0x/subproviders';
import { logUtils } from '@0x/utils';
import { CallDataRPC, marshaller, Web3Wrapper } from '@0x/web3-wrapper';
import { JSONRPCRequestPayload, TxData } from 'ethereum-types';
import { utils } from 'ethers';
import * as _ from 'lodash';
import { Lock } from 'semaphore-async-await';

import { constants } from './constants';
import { BlockParamLiteral } from './types';

interface MaybeFakeTxData extends TxData {
    isFakeTransaction?: boolean;
}

const BLOCK_GAS_LIMIT = 6000000;

export interface TraceCollectionSubproviderConfig {
    shouldCollectTransactionTraces: boolean;
    shouldCollectCallTraces: boolean;
    shouldCollectGasEstimateTraces: boolean;
}

type AsyncFunc = (...args: any[]) => Promise<void>;

// HACK: This wrapper outputs errors to console even if the promise gets ignored
// we need this because web3-provider-engine does not handle promises in
// the after function of next(after).
function logAsyncErrors(fn: AsyncFunc): AsyncFunc {
    async function wrappedAsync(...args: any[]): Promise<void> {
        try {
            await fn(...args);
        } catch (err) {
            logUtils.log(err);
            throw err;
        }
    }
    return wrappedAsync;
}

// Because there is no notion of a call trace in the Ethereum rpc - we collect them in a rather non-obvious/hacky way.
// On each call - we create a snapshot, execute the call as a transaction, get the trace, revert the snapshot.
// That allows us to avoid influencing test behaviour.

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It collects traces of all transactions that were sent and all calls that were executed through JSON RPC. It must
 * be extended by implementing the _recordTxTraceAsync method which is called for every transaction.
 */
export abstract class TraceCollectionSubprovider extends Subprovider {
    protected _web3Wrapper!: Web3Wrapper;
    // Lock is used to not accept normal transactions while doing call/snapshot magic because they'll be reverted later otherwise
    private readonly _lock = new Lock();
    private readonly _defaultFromAddress: string;
    private _isEnabled = true;
    private readonly _config: TraceCollectionSubproviderConfig;
    /**
     * Instantiates a TraceCollectionSubprovider instance
     * @param defaultFromAddress default from address to use when sending transactions
     */
    constructor(defaultFromAddress: string, config: TraceCollectionSubproviderConfig) {
        super();
        this._defaultFromAddress = defaultFromAddress;
        this._config = config;
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
     * @param _end Callback to call if subprovider handled the request and wants to pass back the request.
     */
    // tslint:disable-next-line:prefer-function-over-method async-suffix
    public async handleRequest(payload: JSONRPCRequestPayload, next: NextCallback, _end: ErrorCallback): Promise<void> {
        if (this._isEnabled) {
            switch (payload.method) {
                case 'eth_sendTransaction':
                    if (!this._config.shouldCollectTransactionTraces) {
                        next();
                    } else {
                        const txData = payload.params[0];
                        next(logAsyncErrors(this._onTransactionSentAsync.bind(this, txData)));
                    }
                    return;

                case 'eth_sendRawTransaction':
                    if (!this._config.shouldCollectTransactionTraces) {
                        next();
                    } else {
                        const txData = utils.parseTransaction(payload.params[0]);
                        if (txData.to === null) {
                            txData.to = constants.NEW_CONTRACT;
                        }
                        next(logAsyncErrors(this._onTransactionSentAsync.bind(this, txData)));
                    }
                    return;

                case 'eth_call':
                    if (!this._config.shouldCollectCallTraces) {
                        next();
                    } else {
                        const callData = payload.params[0];
                        next(logAsyncErrors(this._onCallOrGasEstimateExecutedAsync.bind(this, callData)));
                    }
                    return;

                case 'eth_estimateGas':
                    if (!this._config.shouldCollectGasEstimateTraces) {
                        next();
                    } else {
                        const estimateGasData = payload.params[0];
                        next(logAsyncErrors(this._onCallOrGasEstimateExecutedAsync.bind(this, estimateGasData)));
                    }
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
     * @param engine The ProviderEngine this subprovider is added to
     */
    public setEngine(engine: Web3ProviderEngine): void {
        super.setEngine(engine);
        this._web3Wrapper = new Web3Wrapper(engine);
    }
    protected abstract async _recordTxTraceAsync(
        address: string,
        data: string | undefined,
        txHash: string,
    ): Promise<void>;
    private async _onTransactionSentAsync(
        txData: MaybeFakeTxData,
        err: Error | null,
        txHash: string | undefined,
        cb: Callback,
    ): Promise<void> {
        if (!(txData.isFakeTransaction || txData.from === txData.to)) {
            // This transaction is a usual transaction. Not a call executed as one.
            // And we don't want it to be executed within a snapshotting period
            await this._lock.acquire();
        }
        const NULL_ADDRESS = '0x0';
        if (err === null) {
            const toAddress =
                txData.to === undefined || txData.to === NULL_ADDRESS ? constants.NEW_CONTRACT : txData.to;
            await this._recordTxTraceAsync(toAddress, txData.data, txHash as string);
        } else {
            const latestBlock = await this._web3Wrapper.getBlockWithTransactionDataAsync(BlockParamLiteral.Latest);
            const transactions = latestBlock.transactions;
            for (const transaction of transactions) {
                const toAddress =
                    txData.to === undefined || txData.to === NULL_ADDRESS ? constants.NEW_CONTRACT : txData.to;
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
        callData: Partial<CallDataRPC>,
        _err: Error | null,
        _callResult: string,
        cb: Callback,
    ): Promise<void> {
        await this._recordCallOrGasEstimateTraceAsync(callData);
        cb();
    }
    private async _recordCallOrGasEstimateTraceAsync(callData: Partial<CallDataRPC>): Promise<void> {
        // We don't want other transactions to be executed during snashotting period, that's why we lock the
        // transaction execution for all transactions except our fake ones.
        await this._lock.acquire();
        const blockchainLifecycle = new BlockchainLifecycle(this._web3Wrapper);
        await blockchainLifecycle.startAsync();
        const fakeTxData = {
            gas: `0x${BLOCK_GAS_LIMIT.toString(16)}`, // tslint:disable-line:custom-no-magic-numbers
            isFakeTransaction: true, // This transaction (and only it) is allowed to come through when the lock is locked
            ...callData,
            from: callData.from || this._defaultFromAddress,
        };
        try {
            const txData = marshaller.unmarshalTxData(fakeTxData);
            const txHash = await this._web3Wrapper.sendTransactionAsync(txData);
            await this._web3Wrapper.awaitTransactionMinedAsync(txHash, 0);
        } catch (err) {
            // TODO(logvinov) Check that transaction failed and not some other exception
            // Even if this transaction failed - we've already recorded it's trace.
            _.noop();
        }
        await blockchainLifecycle.revertAsync();
        this._lock.release();
    }
}
