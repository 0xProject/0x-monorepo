import { addressUtils, BigNumber, logUtils } from '@0x/utils';
import { OpCode, StructLog } from 'ethereum-types';
import { addHexPrefix } from 'ethereumjs-util';
import * as _ from 'lodash';

import { constants } from './constants';
import { ContractData, LineColumn, SingleFileSourceRange } from './types';

const bytecodeToContractDataIfExists: { [bytecode: string]: ContractData | undefined } = {};

export const utils = {
    compareLineColumn(lhs: LineColumn, rhs: LineColumn): number {
        return lhs.line !== rhs.line ? lhs.line - rhs.line : lhs.column - rhs.column;
    },
    removeHexPrefix(hex: string): string {
        const hexPrefix = '0x';
        return hex.startsWith(hexPrefix) ? hex.slice(hexPrefix.length) : hex;
    },
    isRangeInside(childRange: SingleFileSourceRange, parentRange: SingleFileSourceRange): boolean {
        return (
            utils.compareLineColumn(parentRange.start, childRange.start) <= 0 &&
            utils.compareLineColumn(childRange.end, parentRange.end) <= 0
        );
    },
    isRangeEqual(childRange: SingleFileSourceRange, parentRange: SingleFileSourceRange): boolean {
        return (
            utils.compareLineColumn(parentRange.start, childRange.start) === 0 &&
            utils.compareLineColumn(childRange.end, parentRange.end) === 0
        );
    },
    bytecodeToBytecodeRegex(bytecode: string): string {
        const bytecodeRegex = bytecode
            // Library linking placeholder: __ConvertLib____________________________
            .replace(/_.*_/, '.*')
            // Last 86 characters is solidity compiler metadata that's different between compilations
            .replace(/.{86}$/, '')
            // Libraries contain their own address at the beginning of the code and it's impossible to know it in advance
            .replace(/^0x730000000000000000000000000000000000000000/, '0x73........................................');
        // HACK: Node regexes can't be longer that 32767 characters. Contracts bytecode can. We just truncate the regexes. It's safe in practice.
        const MAX_REGEX_LENGTH = 32767;
        const truncatedBytecodeRegex = bytecodeRegex.slice(0, MAX_REGEX_LENGTH);
        return truncatedBytecodeRegex;
    },
    getContractDataIfExists(contractsData: ContractData[], bytecode: string): ContractData | undefined {
        if (!bytecode.startsWith('0x')) {
            throw new Error(`0x hex prefix missing: ${bytecode}`);
        }
        // HACK(leo): We want to cache the values that are possibly undefined.
        // That's why we can't check for undefined as we usually do, but need to use `hasOwnProperty`.
        if (bytecodeToContractDataIfExists.hasOwnProperty(bytecode)) {
            return bytecodeToContractDataIfExists[bytecode];
        }
        const contractDataCandidates = _.filter(contractsData, contractDataCandidate => {
            const bytecodeRegex = utils.bytecodeToBytecodeRegex(contractDataCandidate.bytecode);
            const runtimeBytecodeRegex = utils.bytecodeToBytecodeRegex(contractDataCandidate.runtimeBytecode);
            // We use that function to find by bytecode or runtimeBytecode. Those are quasi-random strings so
            // collisions are practically impossible and it allows us to reuse that code
            return bytecode.match(bytecodeRegex) !== null || bytecode.match(runtimeBytecodeRegex) !== null;
        });
        if (contractDataCandidates.length > 1) {
            const candidates = contractDataCandidates.map(
                contractDataCandidate => _.values(contractDataCandidate.sources)[0],
            );
            const errMsg =
                "We've found more than one artifact that contains the exact same bytecode and therefore are unable to detect which contract was executed. " +
                "We'll be assigning all traces to the first one.";
            logUtils.warn(errMsg);
            logUtils.warn(candidates);
        }
        return (bytecodeToContractDataIfExists[bytecode] = contractDataCandidates[0]);
    },
    isCallLike(op: OpCode): boolean {
        return _.includes([OpCode.CallCode, OpCode.StaticCall, OpCode.Call, OpCode.DelegateCall], op);
    },
    isEndOpcode(op: OpCode): boolean {
        return _.includes([OpCode.Return, OpCode.Stop, OpCode.Revert, OpCode.Invalid, OpCode.SelfDestruct], op);
    },
    getAddressFromStackEntry(stackEntry: string): string {
        const hexBase = 16;
        return addressUtils.padZeros(new BigNumber(addHexPrefix(stackEntry)).toString(hexBase));
    },
    normalizeStructLogs(structLogs: StructLog[]): StructLog[] {
        if (_.isEmpty(structLogs)) {
            return structLogs;
        }
        const reduceDepthBy1 = (structLog: StructLog) => ({
            ...structLog,
            depth: structLog.depth - 1,
        });
        let normalizedStructLogs = structLogs;
        // HACK(leo): Geth traces sometimes returns those gas costs incorrectly as very big numbers so we manually fix them.
        const normalizeStaticCallCost = (structLog: StructLog) =>
            structLog.op === OpCode.StaticCall
                ? {
                      ...structLog,
                      gasCost: constants.opCodeToGasCost[structLog.op],
                  }
                : structLog;
        // HACK(leo): Geth traces sometimes returns those gas costs incorrectly as very big numbers so we manually fix them.
        const normalizeCallCost = (structLog: StructLog, index: number) => {
            if (structLog.op === OpCode.Call) {
                const callAddress = parseInt(
                    structLog.stack[structLog.stack.length - constants.opCodeToParamToStackOffset[OpCode.Call].to - 1],
                    constants.HEX_BASE,
                );
                const MAX_REASONABLE_PRECOMPILE_ADDRESS = 100;
                if (callAddress < MAX_REASONABLE_PRECOMPILE_ADDRESS) {
                    const nextStructLog = normalizedStructLogs[index + 1];
                    const gasCost = structLog.gas - nextStructLog.gas;
                    return {
                        ...structLog,
                        gasCost,
                    };
                } else {
                    return {
                        ...structLog,
                        gasCost: constants.opCodeToGasCost[structLog.op],
                    };
                }
            } else {
                return structLog;
            }
        };
        const shiftGasCosts1Left = (structLog: StructLog, idx: number) => {
            if (idx === structLogs.length - 1) {
                return {
                    ...structLog,
                    gasCost: 0,
                };
            } else {
                const nextStructLog = structLogs[idx + 1];
                const gasCost = nextStructLog.gasCost;
                return {
                    ...structLog,
                    gasCost,
                };
            }
        };
        if (structLogs[0].depth === 1) {
            // Geth uses 1-indexed depth counter whilst ganache starts from 0
            normalizedStructLogs = _.map(normalizedStructLogs, reduceDepthBy1);
            normalizedStructLogs = _.map(normalizedStructLogs, normalizeCallCost);
            normalizedStructLogs = _.map(normalizedStructLogs, normalizeStaticCallCost);
        } else {
            // Ganache shifts opcodes gas costs so we need to unshift them
            normalizedStructLogs = _.map(normalizedStructLogs, shiftGasCosts1Left);
        }
        return normalizedStructLogs;
    },
    getRange(sourceCode: string, range: SingleFileSourceRange): string {
        const lines = sourceCode.split('\n').slice(range.start.line - 1, range.end.line);
        lines[lines.length - 1] = lines[lines.length - 1].slice(0, range.end.column);
        lines[0] = lines[0].slice(range.start.column);
        return lines.join('\n');
    },
    shortenHex(hex: string, length: number): string {
        return `${hex.substr(0, length + 2)}...${hex.substr(hex.length - length, length)}`;
    },
};
