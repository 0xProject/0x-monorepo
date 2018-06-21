import { addressUtils, BigNumber } from '@0xproject/utils';
import { OpCode, StructLog } from 'ethereum-types';
import { addHexPrefix } from 'ethereumjs-util';
import * as _ from 'lodash';

import { ContractData, LineColumn, SingleFileSourceRange } from './types';

// This is the minimum length of valid contract bytecode. The Solidity compiler
// metadata is 86 bytes. If you add the '0x' prefix, we get 88.
const MIN_CONTRACT_BYTECODE_LENGTH = 88;

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
        const contractData = _.find(contractsData, contractDataCandidate => {
            const bytecodeRegex = utils.bytecodeToBytecodeRegex(contractDataCandidate.bytecode);
            // If the bytecode is less than the minimum length, we are probably
            // dealing with an interface. This isn't what we're looking for.
            if (bytecodeRegex.length < MIN_CONTRACT_BYTECODE_LENGTH) {
                return false;
            }
            const runtimeBytecodeRegex = utils.bytecodeToBytecodeRegex(contractDataCandidate.runtimeBytecode);
            if (runtimeBytecodeRegex.length < MIN_CONTRACT_BYTECODE_LENGTH) {
                return false;
            }
            // We use that function to find by bytecode or runtimeBytecode. Those are quasi-random strings so
            // collisions are practically impossible and it allows us to reuse that code
            return !_.isNull(bytecode.match(bytecodeRegex)) || !_.isNull(bytecode.match(runtimeBytecodeRegex));
        });
        return contractData;
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
        if (structLogs[0].depth === 1) {
            // Geth uses 1-indexed depth counter whilst ganache starts from 0
            const newStructLogs = _.map(structLogs, structLog => ({
                ...structLog,
                depth: structLog.depth - 1,
            }));
            return newStructLogs;
        }
        return structLogs;
    },
    getRange(sourceCode: string, range: SingleFileSourceRange): string {
        const lines = sourceCode.split('\n').slice(range.start.line - 1, range.end.line);
        lines[lines.length - 1] = lines[lines.length - 1].slice(0, range.end.column);
        lines[0] = lines[0].slice(range.start.column);
        return lines.join('\n');
    },
};
