// tslint:disable:number-literal-format
const PUSH1 = 0x60;
const PUSH32 = 0x7f;
const isPush = (inst: number) => inst >= PUSH1 && inst <= PUSH32;

const pushDataLength = (inst: number) => inst - PUSH1 + 1;

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
