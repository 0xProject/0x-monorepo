import { BigNumber, NULL_BYTES } from '@0x/utils';

import { ERC20Token, ERC721Token } from '../types';

export const etherTokenByChain: { [chainId: number]: { address: string } } = {
    3: {
        address: '0xc778417e063141139fce010982780140aa0cd5ab',
    },
    4: {
        address: '0xc778417e063141139fce010982780140aa0cd5ab',
    },
    42: {
        address: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
    },
    1337: {
        address: '',
    },
};
export const erc20TokenInfo: ERC20Token[] = [
    {
        name: 'Augur Reputation Token',
        symbol: 'REP',
        decimals: new BigNumber(18),
        ipfsHash: NULL_BYTES,
        swarmHash: NULL_BYTES,
    },
    {
        name: 'Dai',
        symbol: 'DAI',
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

export const erc721TokenInfo: ERC721Token[] = [
    {
        name: '0xen ERC721',
        symbol: '0xen',
    },
];
