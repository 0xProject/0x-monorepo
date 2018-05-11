import { BigNumber, NULL_BYTES } from '@0xproject/utils';

import { Token } from '../types';

export const tokenInfo: Token[] = [
    {
        name: 'Augur Reputation Token',
        symbol: 'REP',
        decimals: new BigNumber(18),
        ipfsHash: NULL_BYTES,
        swarmHash: NULL_BYTES,
    },
    {
        name: 'Digix DAO Token',
        symbol: 'DGD',
        decimals: new BigNumber(18),
        ipfsHash: NULL_BYTES,
        swarmHash: NULL_BYTES,
    },
    {
        name: 'Golem Network Token',
        symbol: 'GNT',
        decimals: new BigNumber(18),
        ipfsHash: NULL_BYTES,
        swarmHash: NULL_BYTES,
    },
    {
        name: 'MakerDAO',
        symbol: 'MKR',
        decimals: new BigNumber(18),
        ipfsHash: NULL_BYTES,
        swarmHash: NULL_BYTES,
    },
    {
        name: 'Melon Token',
        symbol: 'MLN',
        decimals: new BigNumber(18),
        ipfsHash: NULL_BYTES,
        swarmHash: NULL_BYTES,
    },
];
