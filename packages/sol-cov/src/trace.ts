import { OpCode, StructLog, TransactionTrace } from '@0xproject/types';
import { addressUtils, BigNumber, logUtils } from '@0xproject/utils';
import { addHexPrefix, stripHexPrefix } from 'ethereumjs-util';
import * as fs from 'fs';
import * as _ from 'lodash';

export interface TraceByContractAddress {
    [contractAddress: string]: StructLog[];
}

export function getTracesByContractAddress(structLogs: StructLog[], startAddress: string): TraceByContractAddress {
    const traceByContractAddress: TraceByContractAddress = {};
    let currentTraceSegment = [];
    const callStack = [startAddress];
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < structLogs.length; i++) {
        const structLog = structLogs[i];
        if (structLog.depth !== callStack.length - 1) {
            throw new Error("Malformed trace. trace depth doesn't match call stack depth");
        }
        // After that check we have a guarantee that call stack is never empty
        // If it would: callStack.length - 1 === structLog.depth === -1
        // That means that we can always safely pop from it
        currentTraceSegment.push(structLog);

        if (_.includes([OpCode.CallCode, OpCode.StaticCall, OpCode.Call, OpCode.DelegateCall], structLog.op)) {
            const currentAddress = _.last(callStack) as string;
            const jumpAddressOffset = structLog.op === OpCode.DelegateCall ? 4 : 2;
            const newAddress = addressUtils.padZeros(
                new BigNumber(addHexPrefix(structLog.stack[structLog.stack.length - jumpAddressOffset])).toString(16),
            );
            if (structLog === _.last(structLogs)) {
                throw new Error('CALL-like opcode can not be the last one');
            }
            // Sometimes calls don't change the execution context (current address). When we do a transfer to an
            // externally owned account - it does the call and immidiately returns because there is no fallback
            // function. We manually check if the call depth had changed to handle that case.
            const nextStructLog = structLogs[i + 1];
            if (nextStructLog.depth !== structLog.depth) {
                callStack.push(newAddress);
                traceByContractAddress[currentAddress] = (traceByContractAddress[currentAddress] || []).concat(
                    currentTraceSegment,
                );
                currentTraceSegment = [];
            }
        } else if (
            _.includes([OpCode.Return, OpCode.Stop, OpCode.Revert, OpCode.Invalid, OpCode.SelfDestruct], structLog.op)
        ) {
            const currentAddress = callStack.pop() as string;
            traceByContractAddress[currentAddress] = (traceByContractAddress[currentAddress] || []).concat(
                currentTraceSegment,
            );
            currentTraceSegment = [];
            if (structLog.op === OpCode.SelfDestruct) {
                // TODO: Record contract bytecode before the selfdestruct and handle that scenario
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
        }
    }
    if (callStack.length !== 0) {
        throw new Error('Malformed trace. Call stack non empty at the end');
    }
    if (currentTraceSegment.length !== 0) {
        throw new Error('Malformed trace. currentTraceSegment non empty at the end');
    }
    return traceByContractAddress;
}
