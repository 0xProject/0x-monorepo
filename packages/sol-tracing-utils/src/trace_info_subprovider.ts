import { NodeType } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { constants } from './constants';
import { getContractAddressToTraces } from './trace';
import { TraceCollectionSubprovider } from './trace_collection_subprovider';
import { SubTraceInfo, SubTraceInfoExistingContract, SubTraceInfoNewContract, TraceInfo } from './types';
import { utils } from './utils';

// TraceInfoSubprovider is extended by subproviders which need to work with one
// TraceInfo at a time. It has one abstract method: _handleTraceInfoAsync, which
// is called for each TraceInfo.
export abstract class TraceInfoSubprovider extends TraceCollectionSubprovider {
    protected abstract _handleSubTraceInfoAsync(subTraceInfo: SubTraceInfo): Promise<void>;
    // tslint:disable prefer-function-over-method
    protected async _handleTraceInfoAsync(_traceInfo: TraceInfo): Promise<void> {
        return Promise.resolve(undefined);
    }
    protected async _recordTxTraceAsync(
        address: string,
        dataIfExists: string | undefined,
        txHash: string,
    ): Promise<void> {
        await this._web3Wrapper.awaitTransactionMinedAsync(txHash, 0);
        const nodeType = await this._web3Wrapper.getNodeTypeAsync();
        let trace;
        if (nodeType === NodeType.Geth) {
            // For very large traces we use a custom tracer that outputs a format compatible with a
            // regular trace. We only need the 2nd item on the stack when the instruction is a call.
            // By not including other stack values, we drastically limit the amount of data to be collected.
            // There are no good docs about how to write those tracers, but you can find some example ones here:
            // https://github.com/ethereum/go-ethereum/tree/master/eth/tracers/internal/tracers
            const tracer = `
                {
                    data: [],
                    extractStack: function (stack) {
                        var extract = [];
                        for (var i = 0; i < stack.length(); i++) {
                            extract.push('0x' + stack.peek(i).toString(16));
                        }
                        return extract;
                    },
                    step: function(log) {
                        const op = log.op.toString();
                        const opn = 0 | log.op.toNumber();
                        const pc = 0 | log.getPC();
                        const depth = 0 | log.getDepth();
                        const gasCost = 0 | log.getCost();
                        const gas = 0 | log.getGas();
                        const isCall = opn == 0xf1 || opn == 0xf2 || opn == 0xf4 || opn == 0xf5 || opn == 0xfa;
                        const isMemoryAccess = opn == 0x51 || opn == 0x52 || opn == 0x53;
                        const isCallDataAccess = opn == 0x37;
                        var stack;
                        if (isCall) {
                            stack = ['0x'+log.stack.peek(1).toString(16), null];
                        } else if (isMemoryAccess) {
                            stack = ['0x'+log.stack.peek(0).toString(16)];
                        } else if (isCallDataAccess) {
                            stack = ['0x'+log.stack.peek(2).toString(16), '0x'+log.stack.peek(1).toString(16), '0x'+log.stack.peek(0).toString(16)];
                        }
                        this.data.push({ pc, gasCost, depth, op, stack, gas });
                    },
                    fault: function() { },
                    result: function() { return {structLogs: this.data}; }
                }
            `;
            trace = await this._web3Wrapper.getTransactionTraceAsync(txHash, { tracer, timeout: '600s' });
        } else {
            /**
             * Ganache doesn't support custom tracers yet.
             */
            trace = await this._web3Wrapper.getTransactionTraceAsync(txHash, {
                disableMemory: true,
                disableStack: false,
                disableStorage: true,
            });
        }
        trace.structLogs = utils.normalizeStructLogs(trace.structLogs);
        const traceInfo = {
            trace,
            address,
            dataIfExists,
            txHash,
        };
        await this._handleTraceInfoAsync(traceInfo);
        const contractAddressToTraces = getContractAddressToTraces(trace.structLogs, address);
        const subcallAddresses = _.keys(contractAddressToTraces);
        if (address === constants.NEW_CONTRACT) {
            for (const subcallAddress of subcallAddresses) {
                let subTraceInfo: SubTraceInfoNewContract | SubTraceInfoExistingContract;
                const traceForThatSubcall = contractAddressToTraces[subcallAddress];
                const subcallDepth = traceForThatSubcall[0].depth;
                if (subcallAddress === 'NEW_CONTRACT') {
                    subTraceInfo = {
                        subcallDepth,
                        subtrace: traceForThatSubcall,
                        txHash,
                        address: subcallAddress,
                        bytecode: dataIfExists as string,
                    };
                } else {
                    const runtimeBytecode = await this._web3Wrapper.getContractCodeAsync(subcallAddress);
                    subTraceInfo = {
                        subcallDepth,
                        subtrace: traceForThatSubcall,
                        txHash,
                        address: subcallAddress,
                        runtimeBytecode,
                    };
                }
                await this._handleSubTraceInfoAsync(subTraceInfo);
            }
        } else {
            for (const subcallAddress of subcallAddresses) {
                const runtimeBytecode = await this._web3Wrapper.getContractCodeAsync(subcallAddress);
                const traceForThatSubcall = contractAddressToTraces[subcallAddress];
                const subcallDepth = traceForThatSubcall[0].depth;
                const subTraceInfo: SubTraceInfoExistingContract = {
                    subcallDepth,
                    subtrace: traceForThatSubcall,
                    txHash,
                    address: subcallAddress,
                    runtimeBytecode,
                };
                await this._handleSubTraceInfoAsync(subTraceInfo);
            }
        }
    }
}
