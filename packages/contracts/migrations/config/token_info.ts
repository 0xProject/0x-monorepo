import {constants} from '../../util/constants';
import {TokenInfoByNetwork} from '../../util/types';

export const tokenInfo: TokenInfoByNetwork = {
  development: [
    {
      name: '0x Protocol Token',
      symbol: 'ZRX',
      decimals: 18,
      ipfsHash: constants.NULL_BYTES,
      swarmHash: constants.NULL_BYTES,
    },
    {
      name: 'Augur Reputation Token',
      symbol: 'REP',
      decimals: 18,
      ipfsHash: constants.NULL_BYTES,
      swarmHash: constants.NULL_BYTES,
    },
    {
      name: 'Digix DAO Token',
      symbol: 'DGD',
      decimals: 18,
      ipfsHash: constants.NULL_BYTES,
      swarmHash: constants.NULL_BYTES,
    },
    {
      name: 'Golem Network Token',
      symbol: 'GNT',
      decimals: 18,
      ipfsHash: constants.NULL_BYTES,
      swarmHash: constants.NULL_BYTES,
    },
    {
      name: 'MakerDAO',
      symbol: 'MKR',
      decimals: 18,
      ipfsHash: constants.NULL_BYTES,
      swarmHash: constants.NULL_BYTES,
    },
    {
      name: 'Melon Token',
      symbol: 'MLN',
      decimals: 18,
      ipfsHash: constants.NULL_BYTES,
      swarmHash: constants.NULL_BYTES,
    },
  ],
  live: [
    {
      address: '0xecf8f87f810ecf450940c9f60066b4a7a501d6a7',
      name: 'ETH Wrapper Token',
      symbol: 'WETH',
      decimals: 18,
      ipfsHash: constants.NULL_BYTES,
      swarmHash: constants.NULL_BYTES,
    },
    {
      address: '0x48c80f1f4d53d5951e5d5438b54cba84f29f32a5',
      name: 'Augur Reputation Token',
      symbol: 'REP',
      decimals: 18,
      ipfsHash: constants.NULL_BYTES,
      swarmHash: constants.NULL_BYTES,
    },
    {
      address: '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a',
      name: 'Digix DAO Token',
      symbol: 'DGD',
      decimals: 18,
      ipfsHash: constants.NULL_BYTES,
      swarmHash: constants.NULL_BYTES,
    },
    {
      address: '0xa74476443119a942de498590fe1f2454d7d4ac0d',
      name: 'Golem Network Token',
      symbol: 'GNT',
      decimals: 18,
      ipfsHash: constants.NULL_BYTES,
      swarmHash: constants.NULL_BYTES,
    },
    {
      address: '0xc66ea802717bfb9833400264dd12c2bceaa34a6d',
      name: 'MakerDAO',
      symbol: 'MKR',
      decimals: 18,
      ipfsHash: constants.NULL_BYTES,
      swarmHash: constants.NULL_BYTES,
    },
    {
      address: '0xbeb9ef514a379b997e0798fdcc901ee474b6d9a1',
      name: 'Melon Token',
      symbol: 'MLN',
      decimals: 18,
      ipfsHash: constants.NULL_BYTES,
      swarmHash: constants.NULL_BYTES,
    },
  ],
};
