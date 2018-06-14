import { logUtils } from '@0xproject/utils';
import { OpCode, StructLog } from 'ethereum-types';

import * as _ from 'lodash';

import { EvmCallStack } from './types';
import { utils } from './utils';

export function getRevertTrace(structLogs: StructLog[], startAddress: string): EvmCallStack {
    const evmCallStack: EvmCallStack = [];
    const addressStack = [startAddress];
    if (_.isEmpty(structLogs)) {
        return [];
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
                evmCallStack.push({
                    address: currentAddress,
                    structLog,
                });
            }
        } else if (utils.isEndOpcode(structLog.op) && structLog.op !== OpCode.Revert) {
            // Just like with calls, sometimes returns/stops don't change the execution context (current address).
            const nextStructLog = normalizedStructLogs[i + 1];
            if (_.isUndefined(nextStructLog) || nextStructLog.depth !== structLog.depth) {
                evmCallStack.pop();
                addressStack.pop();
            }
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
        } else if (structLog.op === OpCode.Revert) {
            evmCallStack.push({
                address: _.last(addressStack) as string,
                structLog,
            });
            return evmCallStack;
        } else if (structLog.op === OpCode.Create) {
            // TODO: Extract the new contract address from the stack and handle that scenario
            logUtils.warn(
                "Detected a contract created from within another contract. Sol-cov currently doesn't support that scenario. We'll just skip that trace",
            );
            return [];
        } else {
            if (structLog !== _.last(normalizedStructLogs)) {
                const nextStructLog = normalizedStructLogs[i + 1];
                if (nextStructLog.depth === structLog.depth) {
                    continue;
                } else if (nextStructLog.depth === structLog.depth - 1) {
                    addressStack.pop();
                } else {
                    throw new Error('Malformed trace. Unexpected call depth change');
                }
            }
        }
    }
    if (evmCallStack.length !== 0) {
        logUtils.warn('Malformed trace. Call stack non empty at the end. (probably out of gas)');
    }
    return [];
}
