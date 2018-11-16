import * as _ from 'lodash';

export interface ContractAddresses {
    erc20Proxy: string;
    erc721Proxy: string;
    zrxToken: string;
    etherToken: string;
    exchange: string;
    assetProxyOwner: string;
    forwarder: string;
    orderValidator: string;
}

export enum NetworkId {
    Mainnet = 1,
    Ropsten = 3,
    Rinkeby = 4,
    Kovan = 42,
}

const networkToAddresses: { [networkId: number]: ContractAddresses } = {
    1: {
        erc20Proxy: '0x2240dab907db71e64d3e0dba4800c83b5c502d4e',
        erc721Proxy: '0x208e41fb445f1bb1b6780d58356e81405f3e6127',
        zrxToken: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        etherToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        exchange: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
        assetProxyOwner: '0x17992e4ffb22730138e4b62aaa6367fa9d3699a6',
        forwarder: '0x5468a1dc173652ee28d249c271fa9933144746b1',
        orderValidator: '0x9463e518dea6810309563c81d5266c1b1d149138',
    },
    3: {
        erc20Proxy: '0xb1408f4c245a23c31b98d2c626777d4c0d766caa',
        erc721Proxy: '0xe654aac058bfbf9f83fcaee7793311dd82f6ddb4',
        zrxToken: '0xff67881f8d12f372d91baae9752eb3631ff0ed00',
        etherToken: '0xc778417e063141139fce010982780140aa0cd5ab',
        exchange: '0x4530c0483a1633c7a1c97d2c53721caff2caaaaf',
        assetProxyOwner: '0xf5fa5b5fed2727a0e44ac67f6772e97977aa358b',
        forwarder: '0x2240dab907db71e64d3e0dba4800c83b5c502d4e',
        orderValidator: '0x90431a90516ab49af23a0530e04e8c7836e7122f',
    },
    4: {
        erc20Proxy: '0x3e809c563c15a295e832e37053798ddc8d6c8dab',
        erc721Proxy: '0x8e1ff02637cb5e39f2fa36c14706aa348b065b09',
        zrxToken: '0x2727e688b8fd40b198cd5fe6e408e00494a06f07',
        etherToken: '0xc778417e063141139fce010982780140aa0cd5ab',
        exchange: '0x22ebc052f43a88efa06379426120718170f2204e',
        assetProxyOwner: '0x1da52d1d3a3acfa0a1836b737393b4e9931268fc',
        forwarder: '0xd2dbf3250a764eaaa94fa0c84ed87c0edc8ed04e',
        orderValidator: '0x39c3fc9f4d8430af2713306ce80c584752d9e1c7',
    },
    42: {
        erc20Proxy: '0xf1ec01d6236d3cd881a0bf0130ea25fe4234003e',
        erc721Proxy: '0x2a9127c745688a165106c11cd4d647d2220af821',
        zrxToken: '0x2002d3812f58e35f0ea1ffbf80a75a38c32175fa',
        etherToken: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
        exchange: '0x35dd2932454449b14cee11a94d3674a936d5d7b2',
        assetProxyOwner: '0x2c824d2882baa668e0d5202b1e7f2922278703f8',
        forwarder: '0x17992e4ffb22730138e4b62aaa6367fa9d3699a6',
        orderValidator: '0xb389da3d204b412df2f75c6afb3d0a7ce0bc283d',
    },
};

/**
 * Used to get addresses of contracts that have been deployed to either the
 * Ethereum mainnet or a supported testnet. Throws if there are no known
 * contracts deployed on the corresponding network.
 * @param networkId The desired networkId.
 * @returns The set of addresses for contracts which have been deployed on the
 * given networkId.
 */
export function getContractAddressesForNetworkOrThrow(networkId: NetworkId): ContractAddresses {
    if (_.isUndefined(networkToAddresses[networkId])) {
        throw new Error(`Unknown network id (${networkId}). No known 0x contracts have been deployed on this network.`);
    }
    return networkToAddresses[networkId];
}
