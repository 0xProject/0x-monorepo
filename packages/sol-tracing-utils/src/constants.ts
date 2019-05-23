import { OpCode } from 'ethereum-types';

import { OpCodeToGasCost, OpCodeToParamToStackOffset } from './types';

const opCodeToParamToStackOffset: OpCodeToParamToStackOffset = {
    [OpCode.Call]: {
        gas: 0,
        to: 1,
        value: 1,
    },
    [OpCode.MLoad]: { offset: 0 },
    [OpCode.MStore]: { offset: 0 },
    [OpCode.MStore8]: { offset: 0 },
    [OpCode.CallDataCopy]: { memoryOffset: 0, callDataOffset: 1, length: 2 },
};

const opCodeToGasCost: OpCodeToGasCost = {
    [OpCode.Call]: 700,
    [OpCode.StaticCall]: 40,
};

// tslint:disable:number-literal-format
export const constants = {
    NEW_CONTRACT: 'NEW_CONTRACT' as 'NEW_CONTRACT',
    HEX_BASE: 16,
    PUSH1: 0x60,
    PUSH2: 0x61,
    PUSH32: 0x7f,
    TIMESTAMP: 0x42,
    opCodeToGasCost,
    opCodeToParamToStackOffset,
};
