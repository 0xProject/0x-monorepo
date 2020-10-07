import { constants } from './constants';

const isPush = (inst: number) => inst >= constants.PUSH1 && inst <= constants.PUSH32;

const pushDataLength = (inst: number) => inst - constants.PUSH1 + 1;

const instructionLength = (inst: number) => (isPush(inst) ? pushDataLength(inst) + 1 : 1);

export const getPcToInstructionIndexMapping = (bytecode: Uint8Array) => {
    const result: {
        [programCounter: number]: number;
    } = {};
    let byteIndex = 0;
    let instructionIndex = 0;
    while (byteIndex < bytecode.length) {
        const instruction = bytecode[byteIndex];
        const length = instructionLength(instruction);
        result[byteIndex] = instructionIndex;
        byteIndex += length;
        instructionIndex += 1;
    }
    return result;
};
