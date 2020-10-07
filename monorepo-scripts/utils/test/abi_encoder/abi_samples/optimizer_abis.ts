/* tslint:disable max-file-line-count */
import { MethodAbi } from 'ethereum-types';

export const duplicateDynamicArraysWithStaticElements: MethodAbi = {
    constant: false,
    inputs: [
        {
            name: 'array1',
            type: 'uint[]',
        },
        {
            name: 'array2',
            type: 'uint[]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const duplicateDynamicArraysWithDynamicElements: MethodAbi = {
    constant: false,
    inputs: [
        {
            name: 'array1',
            type: 'string[]',
        },
        {
            name: 'array2',
            type: 'string[]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const duplicateStaticArraysWithStaticElements: MethodAbi = {
    constant: false,
    inputs: [
        {
            name: 'array1',
            type: 'uint[2]',
        },
        {
            name: 'array2',
            type: 'uint[2]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const duplicateStaticArraysWithDynamicElements: MethodAbi = {
    constant: false,
    inputs: [
        {
            name: 'array1',
            type: 'string[2]',
        },
        {
            name: 'array2',
            type: 'string[2]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const duplicateArrayElements: MethodAbi = {
    constant: false,
    inputs: [
        {
            name: 'array',
            type: 'string[]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const duplicateTupleFields: MethodAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'field1',
                    type: 'string',
                },
                {
                    name: 'field2',
                    type: 'string',
                },
            ],
            name: 'Tuple',
            type: 'tuple',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const duplicateStrings: MethodAbi = {
    constant: false,
    inputs: [
        {
            name: 'string1',
            type: 'string',
        },
        {
            name: 'string2',
            type: 'string',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const duplicateBytes: MethodAbi = {
    constant: false,
    inputs: [
        {
            name: 'bytes1',
            type: 'bytes',
        },
        {
            name: 'bytes2',
            type: 'bytes',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const duplicateTuples: MethodAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'field1',
                    type: 'string',
                },
                {
                    name: 'field2',
                    type: 'uint',
                },
            ],
            name: 'Tuple',
            type: 'tuple',
        },
        {
            components: [
                {
                    name: 'field1',
                    type: 'string',
                },
                {
                    name: 'field2',
                    type: 'uint',
                },
            ],
            name: 'Tuple',
            type: 'tuple',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const duplicateArraysNestedInTuples: MethodAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'field',
                    type: 'uint[]',
                },
            ],
            name: 'Tuple1',
            type: 'tuple',
        },
        {
            components: [
                {
                    name: 'field',
                    type: 'uint[]',
                },
                {
                    name: 'extraField',
                    type: 'string',
                },
            ],
            name: 'Tuple2',
            type: 'tuple',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const duplicateTuplesNestedInTuples: MethodAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    components: [
                        {
                            name: 'nestedField',
                            type: 'string',
                        },
                    ],
                    name: 'field',
                    type: 'tuple',
                },
            ],
            name: 'Tuple1',
            type: 'tuple',
        },
        {
            components: [
                {
                    components: [
                        {
                            name: 'nestedField',
                            type: 'string',
                        },
                    ],
                    name: 'field',
                    type: 'tuple',
                },
                {
                    name: 'extraField',
                    type: 'string',
                },
            ],
            name: 'Tuple1',
            type: 'tuple',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const duplicateTwoDimensionalArrays: MethodAbi = {
    constant: false,
    inputs: [
        {
            name: 'array1',
            type: 'string[][]',
        },
        {
            name: 'array2',
            type: 'string[][]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const arrayElementsDuplicatedAsSeparateParameter: MethodAbi = {
    constant: false,
    inputs: [
        {
            name: 'stringArray',
            type: 'string[]',
        },
        {
            name: 'string',
            type: 'string',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};

export const arrayElementsDuplicatedAsTupleFields: MethodAbi = {
    constant: false,
    inputs: [
        {
            name: 'uint8Array',
            type: 'uint8[]',
        },
        {
            components: [
                {
                    name: 'uint',
                    type: 'uint',
                },
            ],
            name: 'uintTuple',
            type: 'tuple[]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};
