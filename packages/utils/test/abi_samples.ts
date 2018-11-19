import { MethodAbi } from 'ethereum-types';

export const simpleAbi = {
    constant: false,
    inputs: [
        {
            name: 'greg',
            type: 'uint256',
        },
        {
            name: 'gregStr',
            type: 'string',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const stringAbi = {
    constant: false,
    inputs: [
        {
            name: 'greg',
            type: 'string[]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;


export const GAbi = {
    constant: false,
    inputs: [
        {
            components: [{
                name: 'a',
                type: 'uint256',
            },
            {
                name: 'b',
                type: 'string',
            },
            {
                name: 'e',
                type: 'bytes',
            },
            {
                name: 'f',
                type: 'address',
            }],

            name: 'f',
            type: 'tuple',

        }
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const optimizerAbi2 = {
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
} as MethodAbi;

export const optimizerAbi3 = {
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
} as MethodAbi;

export const optimizerAbi4 = {
    constant: false,
    inputs: [
        {
            name: 'uint8Array',
            type: 'uint8[4]',
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
} as MethodAbi;

export const typesWithDefaultWidthsAbi = {
    constant: false,
    inputs: [
        {
            name: 'someUint',
            type: 'uint',
        },
        {
            name: 'someInt',
            type: 'int',
        },
        {
            name: 'someByte',
            type: 'byte',
        },
        {
            name: 'someUint',
            type: 'uint[]',
        },
        {
            name: 'someInt',
            type: 'int[]',
        },
        {
            name: 'someByte',
            type: 'byte[]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const multiDimensionalArraysStaticTypeAbi = {
    constant: false,
    inputs: [
        {
            name: 'a',
            type: 'uint8[][][]',
        },
        {
            name: 'b',
            type: 'uint8[][][2]',
        },
        {
            name: 'c',
            type: 'uint8[][2][]',
        },
        {
            name: 'd',
            type: 'uint8[2][][]',
        },
        {
            name: 'e',
            type: 'uint8[][2][2]',
        },
        {
            name: 'f',
            type: 'uint8[2][2][]',
        },
        {
            name: 'g',
            type: 'uint8[2][][2]',
        },
        {
            name: 'h',
            type: 'uint8[2][2][2]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const multiDimensionalArraysDynamicTypeAbi = {
    constant: false,
    inputs: [
        {
            name: 'a',
            type: 'string[][][]',
        },
        {
            name: 'b',
            type: 'string[][][2]',
        },
        {
            name: 'c',
            type: 'string[][2][]',
        },
        {
            name: 'h',
            type: 'string[2][2][2]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const dynamicTupleAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'someUint',
                    type: 'uint256',
                },
                {
                    name: 'someStr',
                    type: 'string',
                },
            ],
            name: 'order',
            type: 'tuple',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const arrayOfStaticTuplesWithDefinedLengthAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'someUint',
                    type: 'uint256',
                },
                {
                    name: 'someUint2',
                    type: 'uint256',
                },
            ],
            name: 'order',
            type: 'tuple[8]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const arrayOfStaticTuplesWithDynamicLengthAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'someUint',
                    type: 'uint256',
                },
                {
                    name: 'someUint2',
                    type: 'uint256',
                },
            ],
            name: 'order',
            type: 'tuple[]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const arrayOfDynamicTuplesWithDefinedLengthAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'someUint',
                    type: 'uint256',
                },
                {
                    name: 'someString',
                    type: 'string',
                },
            ],
            name: 'order',
            type: 'tuple[8]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const arrayOfDynamicTuplesWithUndefinedLengthAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'someUint',
                    type: 'uint256',
                },
                {
                    name: 'someString',
                    type: 'string',
                },
            ],
            name: 'order',
            type: 'tuple[]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const arrayOfDynamicTuplesAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'someUint',
                    type: 'uint256',
                },
                {
                    name: 'someString',
                    type: 'string',
                },
            ],
            name: 'order',
            type: 'tuple[]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const multidimensionalArrayOfDynamicTuplesAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'someUint',
                    type: 'uint256',
                },
                {
                    name: 'someString',
                    type: 'string',
                },
            ],
            name: 'order',
            type: 'tuple[][2][]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const staticTupleAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'someUint1',
                    type: 'uint256',
                },
                {
                    name: 'someUint2',
                    type: 'uint256',
                },
                {
                    name: 'someUint3',
                    type: 'uint256',
                },
                {
                    name: 'someBool',
                    type: 'bool',
                },
            ],
            name: 'order',
            type: 'tuple',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const staticArrayAbi = {
    constant: false,
    inputs: [
        {
            name: 'someStaticArray',
            type: 'uint8[3]',
        }
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const staticArrayDynamicMembersAbi = {
    constant: false,
    inputs: [
        {
            name: 'someStaticArray',
            type: 'string[3]',
        }
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const dynamicArrayDynamicMembersAbi = {
    constant: false,
    inputs: [
        {
            name: 'someStaticArray',
            type: 'string[]',
        }
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const dynamicArrayStaticMembersAbi = {
    constant: false,
    inputs: [
        {
            name: 'someStaticArray',
            type: 'uint8[]',
        }
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const largeFlatAbi = {
    constant: false,
    inputs: [
        {
            name: 'someUInt256',
            type: 'uint256',
        },
        {
            name: 'someInt256',
            type: 'int256',
        },
        {
            name: 'someInt32',
            type: 'int32',
        },
        {
            name: 'someByte',
            type: 'byte',
        },
        {
            name: 'someBytes32',
            type: 'bytes32',
        },
        {
            name: 'someBytes',
            type: 'bytes',
        },
        {
            name: 'someString',
            type: 'string',
        },
        {
            name: 'someAddress',
            type: 'address',
        },
        {
            name: 'someBool',
            type: 'bool',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const largeNestedAbi = {
    constant: false,
    inputs: [
        {
            name: 'someStaticArray',
            type: 'uint8[3]',
        },
        {
            name: 'someStaticArrayWithDynamicMembers',
            type: 'string[2]',
        },
        {
            name: 'someDynamicArrayWithDynamicMembers',
            type: 'bytes[]',
        },
        {
            name: 'some2DArray',
            type: 'string[][]',
        },
        {
            name: 'someTuple',
            type: 'tuple',
            components: [
                {
                    name: 'someUint32',
                    type: 'uint32',
                },
                {
                    name: 'someStr',
                    type: 'string',
                },
            ],
        },
        {
            name: 'someTupleWithDynamicTypes',
            type: 'tuple',
            components: [
                {
                    name: 'someUint',
                    type: 'uint256',
                },
                {
                    name: 'someStr',
                    type: 'string',
                },
                /*{
                    name: 'someStrArray',
                    type: 'string[]',
                },*/
                {
                    name: 'someBytes',
                    type: 'bytes',
                },
                {
                    name: 'someAddress',
                    type: 'address',
                },
            ],
        },
        {
            name: 'someArrayOfTuplesWithDynamicTypes',
            type: 'tuple[]',
            components: [
                {
                    name: 'someUint',
                    type: 'uint256',
                },
                {
                    name: 'someStr',
                    type: 'string',
                },
                /*{
                    name: 'someStrArray',
                    type: 'string[]',
                },*/
                {
                    name: 'someBytes',
                    type: 'bytes',
                },
                {
                    name: 'someAddress',
                    type: 'address',
                },
            ],
        }
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const nestedTuples = {
    constant: false,
    inputs: [
        {
            name: 'firstTuple',
            type: 'tuple[1]',
            components: [
                {
                    name: 'someUint32',
                    type: 'uint32',
                },
                {
                    name: 'nestedTuple',
                    type: 'tuple',
                    components: [
                        {
                            name: 'someUint',
                            type: 'uint256',
                        },
                        {
                            name: 'someAddress',
                            type: 'address',
                        },
                    ],
                },
            ],
        },
        {
            name: 'secondTuple',
            type: 'tuple[]',
            components: [
                {
                    name: 'someUint',
                    type: 'uint256',
                },
                {
                    name: 'someStr',
                    type: 'string',
                },
                {
                    name: 'nestedTuple',
                    type: 'tuple',
                    components: [
                        {
                            name: 'someUint32',
                            type: 'uint32',
                        },
                        {
                            name: 'secondNestedTuple',
                            type: 'tuple',
                            components: [
                                {
                                    name: 'someUint',
                                    type: 'uint256',
                                },
                                {
                                    name: 'someStr',
                                    type: 'string',
                                },
                                {
                                    name: 'someBytes',
                                    type: 'bytes',
                                },
                                {
                                    name: 'someAddress',
                                    type: 'address',
                                },
                            ],
                        },
                    ],
                },
                {
                    name: 'someBytes',
                    type: 'bytes',
                },
                {
                    name: 'someAddress',
                    type: 'address',
                },
            ],
        }
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const simpleAbi2 = {
    constant: false,
    inputs: [
        {
            name: 'someByte',
            type: 'byte',
        },
        {
            name: 'someBytes32',
            type: 'bytes32',
        },
        {
            name: 'someBytes',
            type: 'bytes',
        },
        {
            name: 'someString',
            type: 'string',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

export const fillOrderAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'makerAddress',
                    type: 'address',
                },
                {
                    name: 'takerAddress',
                    type: 'address',
                },
                {
                    name: 'feeRecipientAddress',
                    type: 'address',
                },
                {
                    name: 'senderAddress',
                    type: 'address',
                },
                {
                    name: 'makerAssetAmount',
                    type: 'uint256',
                },
                {
                    name: 'takerAssetAmount',
                    type: 'uint256',
                },
                {
                    name: 'makerFee',
                    type: 'uint256',
                },
                {
                    name: 'takerFee',
                    type: 'uint256',
                },
                {
                    name: 'expirationTimeSeconds',
                    type: 'uint256',
                },
                {
                    name: 'salt',
                    type: 'uint256',
                },
                {
                    name: 'makerAssetData',
                    type: 'bytes',
                },
                {
                    name: 'takerAssetData',
                    type: 'bytes',
                },
            ],
            name: 'order',
            type: 'tuple',
        },
        {
            name: 'takerAssetFillAmount',
            type: 'uint256',
        },
        {
            name: 'salt',
            type: 'uint256',
        },
        {
            name: 'orderSignature',
            type: 'bytes',
        },
        {
            name: 'takerSignature',
            type: 'bytes',
        },
    ],
    name: 'fillOrder',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;
