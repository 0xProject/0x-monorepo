import { StructLog } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from './constants';
import { getTracesByContractAddress } from './trace';
import { TraceCollectionSubprovider } from './trace_collection_subprovider';
import { TraceInfo, TraceInfoExistingContract, TraceInfoNewContract } from './types';

// TraceInfoSubprovider is extended by subproviders which need to work with one
// TraceInfo at a time. It has one abstract method: _handleTraceInfoAsync, which
// is called for each TraceInfo.
export abstract class TraceInfoSubprovider extends TraceCollectionSubprovider {
    protected abstract _handleTraceInfoAsync(traceInfo: TraceInfo): Promise<void>;
    protected async _recordTxTraceAsync(address: string, data: string | undefined, txHash: string): Promise<void> {
        await this._web3Wrapper.awaitTransactionMinedAsync(txHash, 0);
        // For very large traces we use a custom tracer that outputs a format compatible with a
        // regular trace. We only need the 2nd item on the stack when the instruction is a call.
        // By not including othe stack values, we severly limit the amount of data to be collectd.
        const tracer =
            '{' +
            '    data: [],' +
            '    step: function(log) {' +
            '        const op = log.op.toString();' +
            '        const opn = 0 | log.op.toNumber();' +
            '        const pc = 0 | log.getPC();' +
            '        const depth = 0 | log.getDepth();' +
            '        const gas = 0 | log.getGas();' +
            '        const isCall = opn == 0xf1 || opn == 0xf2 || opn == 0xf4 || opn == 0xf5;' +
            "        const stack = isCall ? ['0x'+log.stack.peek(1).toString(16), null] : null;" +
            '        this.data.push({ pc, gas, depth, op, stack}); ' +
            '    },' +
            '    fault: function() { },' +
            '    result: function() { return {structLogs: this.data}; }' +
            '}';
        const trace = await this._web3Wrapper.getTransactionTraceAsync(txHash, { tracer, timeout: '600s' });
        const tracesByContractAddress = getTracesByContractAddress(trace.structLogs, address);
        const subcallAddresses = _.keys(tracesByContractAddress);
        if (address === constants.NEW_CONTRACT) {
            for (const subcallAddress of subcallAddresses) {
                let traceInfo: TraceInfoNewContract | TraceInfoExistingContract;
                if (subcallAddress === 'NEW_CONTRACT') {
                    const traceForThatSubcall = tracesByContractAddress[subcallAddress];
                    traceInfo = {
                        subtrace: traceForThatSubcall,
                        txHash,
                        address: subcallAddress,
                        bytecode: data as string,
                    };
                } else {
                    const runtimeBytecode = await this._web3Wrapper.getContractCodeAsync(subcallAddress);
                    const traceForThatSubcall = tracesByContractAddress[subcallAddress];
                    traceInfo = {
                        subtrace: traceForThatSubcall,
                        txHash,
                        address: subcallAddress,
                        runtimeBytecode,
                    };
                }
                await this._handleTraceInfoAsync(traceInfo);
            }
        } else {
            for (const subcallAddress of subcallAddresses) {
                const runtimeBytecode = await this._web3Wrapper.getContractCodeAsync(subcallAddress);
                const traceForThatSubcall = tracesByContractAddress[subcallAddress];
                const traceInfo: TraceInfoExistingContract = {
                    subtrace: traceForThatSubcall,
                    txHash,
                    address: subcallAddress,
                    runtimeBytecode,
                };
                await this._handleTraceInfoAsync(traceInfo);
            }
        }
    }
}
