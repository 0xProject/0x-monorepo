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
        await this._ethRPCClient.awaitTransactionMinedAsync(txHash, 0);
        const trace = await this._ethRPCClient.getTransactionTraceAsync(txHash, {
            disableMemory: true,
            disableStack: false,
            disableStorage: true,
        });
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
                    const runtimeBytecode = await this._ethRPCClient.getContractCodeAsync(subcallAddress);
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
                const runtimeBytecode = await this._ethRPCClient.getContractCodeAsync(subcallAddress);
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
