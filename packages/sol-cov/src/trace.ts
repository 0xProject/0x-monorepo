import { StructLog, TransactionTrace } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { addHexPrefix, stripHexPrefix } from 'ethereumjs-util';
import * as fs from 'fs';
import * as _ from 'lodash';

export interface TraceByContractAddress {
    [contractAddress: string]: StructLog[];
}
function padZeros(address: string) {
    return addHexPrefix(_.padStart(stripHexPrefix(address), 40, '0'));
}

export function getTracesByContractAddress(structLogs: StructLog[], startAddress: string): TraceByContractAddress {
    const traceByContractAddress: TraceByContractAddress = {};
    let currentTraceSegment = [];
    const callStack = [startAddress];
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < structLogs.length; ++i) {
        const structLog = structLogs[i];
        if (structLog.depth !== callStack.length - 1) {
            throw new Error("Malformed trace. trace depth doesn't match call stack depth");
        }
        // After that check we have a guarantee that call stack is never empty
        // If it would: callStack.length - 1 === structLog.depth === -1
        // That means that we can always safely pop from it
        currentTraceSegment.push(structLog);

        if (structLog.op === 'DELEGATECALL') {
            const currentAddress = _.last(callStack) as string;
            const jumpAddressOffset = 4;
            const newAddress = padZeros(new BigNumber(addHexPrefix(structLog.stack[jumpAddressOffset])).toString(16));
            callStack.push(newAddress);
            traceByContractAddress[currentAddress] = (traceByContractAddress[currentAddress] || []).concat(
                currentTraceSegment,
            );
            currentTraceSegment = [];
        } else if (structLog.op === 'RETURN') {
            const currentAddress = callStack.pop() as string;
            traceByContractAddress[currentAddress] = (traceByContractAddress[currentAddress] || []).concat(
                currentTraceSegment,
            );
            currentTraceSegment = [];
        } else if (structLog.op === 'STOP') {
            const currentAddress = callStack.pop() as string;
            traceByContractAddress[currentAddress] = (traceByContractAddress[currentAddress] || []).concat(
                currentTraceSegment,
            );
            currentTraceSegment = [];
            if (i !== structLogs.length - 1) {
                throw new Error('Malformed trace. STOP is not the last opcode executed');
            }
        } else if (structLog.op === 'CREATE') {
            console.warn(
                "Detected a contract created from within another contract. Sol-cov currently doesn't support that scenario. We'll just skip that trace",
            );
            return traceByContractAddress;
        } else if (structLog.op === 'CALL') {
            const currentAddress = _.last(callStack) as string;
            const jumpAddressOffset = 2;
            const newAddress = padZeros(new BigNumber(addHexPrefix(structLog.stack[jumpAddressOffset])).toString(16));
            callStack.push(newAddress);
            traceByContractAddress[currentAddress] = (traceByContractAddress[currentAddress] || []).concat(
                currentTraceSegment,
            );
            currentTraceSegment = [];
        } else if (structLog.op === 'CALLCODE') {
            throw new Error('CALLCODE opcode unsupported by coverage');
        } else if (structLog.op === 'STATICCALL') {
            throw new Error('STATICCALL opcode unsupported by coverage');
        } else if (structLog.op === 'REVERT') {
            const currentAddress = callStack.pop() as string;
            traceByContractAddress[currentAddress] = (traceByContractAddress[currentAddress] || []).concat(
                currentTraceSegment,
            );
            currentTraceSegment = [];
            if (i !== structLogs.length - 1) {
                throw new Error('Malformed trace. REVERT is not the last opcode executed');
            }
        } else if (structLog.op === 'INVALID') {
            const currentAddress = callStack.pop() as string;
            traceByContractAddress[currentAddress] = (traceByContractAddress[currentAddress] || []).concat(
                currentTraceSegment,
            );
            currentTraceSegment = [];
            if (i !== structLogs.length - 1) {
                throw new Error('Malformed trace. INVALID is not the last opcode executed');
            }
        } else if (structLog.op === 'SELFDESTRUCT') {
            throw new Error('SELFDESTRUCT opcode unsupported by coverage');
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
