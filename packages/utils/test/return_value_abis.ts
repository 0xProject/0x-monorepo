import { MethodAbi } from 'ethereum-types';

export const noReturnValues = {
    constant: false,
    inputs: [],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const singleStaticReturnValue = {
    constant: false,
    inputs: [],
    name: 'simpleFunction',
    outputs: [
        {
            name: 'Bytes4',
            type: 'bytes4',
        },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const multipleStaticReturnValues = {
    constant: false,
    inputs: [],
    name: 'simpleFunction',
    outputs: [
        {
            name: 'val1',
            type: 'bytes4',
        },
        {
            name: 'val2',
            type: 'bytes4',
        },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const singleDynamicReturnValue = {
    constant: false,
    inputs: [],
    name: 'simpleFunction',
    outputs: [
        {
            name: 'val',
            type: 'bytes',
        },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const multipleDynamicReturnValues = {
    constant: false,
    inputs: [],
    name: 'simpleFunction',
    outputs: [
        {
            name: 'val1',
            type: 'bytes',
        },
        {
            name: 'val2',
            type: 'bytes',
        },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const mixedStaticAndDynamicReturnValues = {
    constant: false,
    inputs: [],
    name: 'simpleFunction',
    outputs: [
        {
            name: 'val1',
            type: 'bytes4',
        },
        {
            name: 'val2',
            type: 'bytes',
        },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;
