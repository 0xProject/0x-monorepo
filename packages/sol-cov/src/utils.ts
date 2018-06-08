import * as _ from 'lodash';

import { ContractData, LineColumn, SingleFileSourceRange } from './types';

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
        // HACK: Node regexes can't be longer that 32767 characters. Contracts bytecode can. We jsut truncate the regexes. It's safe in practice.
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
            const runtimeBytecodeRegex = utils.bytecodeToBytecodeRegex(contractDataCandidate.runtimeBytecode);
            // We use that function to find by bytecode or runtimeBytecode. Those are quasi-random strings so
            // collisions are practically impossible and it allows us to reuse that code
            return !_.isNull(bytecode.match(bytecodeRegex)) || !_.isNull(bytecode.match(runtimeBytecodeRegex));
        });
        return contractData;
    },
};
