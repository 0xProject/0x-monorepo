import { ConstructorAbi } from 'ethereum-types';

export const simpleAbi: ConstructorAbi = {
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
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
};

export const noArgumentConstructor: ConstructorAbi = {
    inputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
};
