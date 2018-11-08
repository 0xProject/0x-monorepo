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

export const crazyAbi = {
    constant: false,
    inputs: [
        /*{
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
        },*/
        /*{
            name: 'someAddress',
            type: 'address',
        },
        {
            name: 'someBool',
            type: 'bool',
        },*/

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
        /* {
            name: 'some2DArray',
            type: 'string[][]',
        }, */
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
                //{
                //      name: 'someStrArray',
                //     type: 'string[]',
                /// },
                {
                    name: 'someBytes',
                    type: 'bytes',
                },
                {
                    name: 'someAddress',
                    type: 'address',
                },
            ],
        } /*,
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
                {
                    name: 'someStrArray',
                    type: 'string[]',
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
        },*/,
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
