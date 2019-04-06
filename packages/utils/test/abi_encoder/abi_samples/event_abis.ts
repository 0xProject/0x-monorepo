import { EventAbi } from 'ethereum-types';

export const erc721TransferEvent: EventAbi = {
    anonymous: false,
    inputs: [
        {
            indexed: true,
            name: '_from',
            type: 'address',
        },
        {
            indexed: true,
            name: '_to',
            type: 'address',
        },
        {
            indexed: true,
            name: '_tokenId',
            type: 'uint256',
        },
    ],
    name: 'Transfer',
    type: 'event',
};

export const erc721TransferNoIndexOnTokenIdEvent: EventAbi = {
    anonymous: false,
    inputs: [
        {
            indexed: true,
            name: '_from',
            type: 'address',
        },
        {
            indexed: true,
            name: '_to',
            type: 'address',
        },
        {
            indexed: false,
            name: '_tokenId',
            type: 'uint256',
        },
    ],
    name: 'Transfer',
    type: 'event',
};
