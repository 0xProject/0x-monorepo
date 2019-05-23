/* tslint:disable max-file-line-count */
import { MethodAbi } from 'ethereum-types';

export const noReturnValues: MethodAbi = {
    constant: false,
    inputs: [],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const singleStaticReturnValue: MethodAbi = {
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
};

export const multipleStaticReturnValues: MethodAbi = {
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
};

export const singleDynamicReturnValue: MethodAbi = {
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
};

export const multipleDynamicReturnValues: MethodAbi = {
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
};

export const mixedStaticAndDynamicReturnValues: MethodAbi = {
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
};

export const structuredReturnValue: MethodAbi = {
    constant: false,
    inputs: [],
    name: 'fillOrder',
    outputs: [
        {
            components: [
                {
                    name: 'makerAssetFilledAmount',
                    type: 'uint256',
                },
                {
                    name: 'takerAssetFilledAmount',
                    type: 'uint256',
                },
            ],
            name: 'fillResults',
            type: 'tuple',
        },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};
