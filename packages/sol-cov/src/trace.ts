import { logUtils } from '@0xproject/utils';
import { OpCode, StructLog } from 'ethereum-types';
import * as _ from 'lodash';

import { utils } from './utils';

export interface TraceByContractAddress {
    [contractAddress: string]: StructLog[];
}

export function getTracesByContractAddress(structLogs: StructLog[], startAddress: string): TraceByContractAddress {
    const traceByContractAddress: TraceByContractAddress = {};
    let currentTraceSegment = [];
    const addressStack = [startAddress];
    if (_.isEmpty(structLogs)) {
        return traceByContractAddress;
    }
    const normalizedStructLogs = utils.normalizeStructLogs(structLogs);
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < normalizedStructLogs.length; i++) {
        const structLog = normalizedStructLogs[i];
        if (structLog.depth !== addressStack.length - 1) {
            throw new Error("Malformed trace. Trace depth doesn't match call stack depth");
        }
        // After that check we have a guarantee that call stack is never empty
        // If it would: callStack.length - 1 === structLog.depth === -1
        // That means that we can always safely pop from it
        currentTraceSegment.push(structLog);

        if (utils.isCallLike(structLog.op)) {
            const currentAddress = _.last(addressStack) as string;
            const jumpAddressOffset = 1;
            const newAddress = utils.getAddressFromStackEntry(
                structLog.stack[structLog.stack.length - jumpAddressOffset - 1],
            );

            // Sometimes calls don't change the execution context (current address). When we do a transfer to an
            // externally owned account - it does the call and immediately returns because there is no fallback
            // function. We manually check if the call depth had changed to handle that case.
            const nextStructLog = normalizedStructLogs[i + 1];
            if (nextStructLog.depth !== structLog.depth) {
                addressStack.push(newAddress);
                traceByContractAddress[currentAddress] = (traceByContractAddress[currentAddress] || []).concat(
                    currentTraceSegment,
                );
                currentTraceSegment = [];
            }
        } else if (utils.isEndOpcode(structLog.op)) {
            const currentAddress = addressStack.pop() as string;
            traceByContractAddress[currentAddress] = (traceByContractAddress[currentAddress] || []).concat(
                currentTraceSegment,
            );
            currentTraceSegment = [];
            if (structLog.op === OpCode.SelfDestruct) {
                // After contract execution, we look at all sub-calls to external contracts, and for each one, fetch
                // the bytecode and compute the coverage for the call. If the contract is destroyed with a call
                // to `selfdestruct`, we are unable to fetch it's bytecode and compute coverage.
                // TODO: Refactor this logic to fetch the sub-called contract bytecode before the selfdestruct is called
                // in order to handle this edge-case.
                logUtils.warn(
                    "Detected a selfdestruct. Sol-cov currently doesn't support that scenario. We'll just skip the trace part for a destructed contract",
                );
            }
        } else if (structLog.op === OpCode.Create) {
            // TODO: Extract the new contract address from the stack and handle that scenario
            logUtils.warn(
                "Detected a contract created from within another contract. Sol-cov currently doesn't support that scenario. We'll just skip that trace",
            );
            return traceByContractAddress;
        } else {
            if (structLog !== _.last(normalizedStructLogs)) {
                const nextStructLog = normalizedStructLogs[i + 1];
                if (nextStructLog.depth === structLog.depth) {
                    continue;
                } else if (nextStructLog.depth === structLog.depth - 1) {
                    const currentAddress = addressStack.pop() as string;
                    traceByContractAddress[currentAddress] = (traceByContractAddress[currentAddress] || []).concat(
                        currentTraceSegment,
                    );
                    currentTraceSegment = [];
                } else {
                    throw new Error('Malformed trace. Unexpected call depth change');
                }
            }
        }
    }
    if (addressStack.length !== 0) {
        logUtils.warn('Malformed trace. Call stack non empty at the end');
    }
    if (currentTraceSegment.length !== 0) {
        const currentAddress = addressStack.pop() as string;
        traceByContractAddress[currentAddress] = (traceByContractAddress[currentAddress] || []).concat(
            currentTraceSegment,
        );
        currentTraceSegment = [];
        logUtils.warn('Malformed trace. Current trace segment non empty at the end');
    }
    return traceByContractAddress;
}
