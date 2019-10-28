import * as _ from 'lodash';

export interface ContractAddresses {
    erc20Proxy: string;
    erc721Proxy: string;
    zrxToken: string;
    etherToken: string;
    exchangeV2: string;
    exchange: string;
    assetProxyOwner: string;
    zeroExGovernor: string;
    forwarder: string;
    orderValidator: string;
    dutchAuction: string;
    coordinatorRegistry: string;
    coordinator: string;
    multiAssetProxy: string;
    staticCallProxy: string;
    erc1155Proxy: string;
    devUtils: string;
    zrxVault: string;
    staking: string;
    stakingProxy: string;
    erc20BridgeProxy: string;
}

export enum NetworkId {
    Mainnet = 1,
    Ropsten = 3,
    Rinkeby = 4,
    Kovan = 42,
    Ganache = 50,
}

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const networkToAddresses: { [networkId: number]: ContractAddresses } = {
    1: {
        exchangeV2: '0x080bf510fcbf18b91105470639e9561022937712',
        exchange: NULL_ADDRESS,
        erc20Proxy: '0x95e6f48254609a6ee006f7d493c8e5fb97094cef',
        erc721Proxy: '0xefc70a1b18c432bdc64b596838b4d138f6bc6cad',
        forwarder: NULL_ADDRESS,
        orderValidator: NULL_ADDRESS,
        zrxToken: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        etherToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        assetProxyOwner: '0xdffe798c7172dd6deb32baee68af322e8f495ce0',
        zeroExGovernor: NULL_ADDRESS,
        dutchAuction: NULL_ADDRESS,
        coordinatorRegistry: '0x45797531b873fd5e519477a070a955764c1a5b07',
        coordinator: NULL_ADDRESS,
        multiAssetProxy: '0xef701d5389ae74503d633396c4d654eabedc9d78',
        staticCallProxy: '0x3517b88c19508c08650616019062b898ab65ed29',
        erc1155Proxy: '0x7eefbd48fd63d441ec7435d024ec7c5131019add',
        zrxVault: NULL_ADDRESS,
        staking: NULL_ADDRESS,
        stakingProxy: NULL_ADDRESS,
        devUtils: NULL_ADDRESS,
        erc20BridgeProxy: NULL_ADDRESS,
    },
    3: {
        erc20Proxy: '0xb1408f4c245a23c31b98d2c626777d4c0d766caa',
        erc721Proxy: '0xe654aac058bfbf9f83fcaee7793311dd82f6ddb4',
        zrxToken: '0xff67881f8d12f372d91baae9752eb3631ff0ed00',
        etherToken: '0xc778417e063141139fce010982780140aa0cd5ab',
        exchangeV2: '0xbff9493f92a3df4b0429b6d00743b3cfb4c85831',
        exchange: '0xc56388332ddfc98701fefed94535100c6166956c',
        assetProxyOwner: NULL_ADDRESS,
        zeroExGovernor: '0xdcf20f7b447d51f2b3e5499b7f6cbbf7295a5d26',
        forwarder: '0x31c3890769ed3bb30b2781fd238a5bb7ecfeb7c8',
        orderValidator: NULL_ADDRESS,
        dutchAuction: NULL_ADDRESS,
        coordinatorRegistry: '0x403cc23e88c17c4652fb904784d1af640a6722d9',
        coordinator: NULL_ADDRESS,
        multiAssetProxy: '0xab8fbd189c569ccdee3a4d929bb7f557be4028f6',
        staticCallProxy: '0xe1b97e47aa3796276033a5341e884d2ba46b6ac1',
        erc1155Proxy: '0x19bb6caa3bc34d39e5a23cedfa3e6c7e7f3c931d',
        devUtils: '0x3dfd5157eec10eb1a357c1074de30787ce92cb43',
        zrxVault: '0xffd161026865ad8b4ab28a76840474935eec4dfa',
        staking: '0x3f46b98061a3e1e1f41dff296ec19402c298f8a9',
        stakingProxy: '0xfaabcee42ab6b9c649794ac6c133711071897ee9',
        erc20BridgeProxy: '0x599b340b5045436a99b1f0c718d30f5a0c8519dd',
    },
    4: {
        exchangeV2: '0xbff9493f92a3df4b0429b6d00743b3cfb4c85831',
        exchange: '0x3afe8aa355e086d898447732cfa5d931cfb2a792',
        erc20Proxy: '0x2f5ae4f6106e89b4147651688a92256885c5f410',
        erc721Proxy: '0x7656d773e11ff7383a14dcf09a9c50990481cd10',
        zrxToken: '0x8080c7e4b81ecf23aa6f877cfbfd9b0c228c6ffa',
        etherToken: '0xc778417e063141139fce010982780140aa0cd5ab',
        assetProxyOwner: NULL_ADDRESS,
        zeroExGovernor: '0x5d751aa855a1aee5fe44cf5350ed25b5727b66ae',
        forwarder: '0xc6db36aeb96a2eb52079c342c3a980c83dea8e3c',
        orderValidator: NULL_ADDRESS,
        dutchAuction: NULL_ADDRESS,
        coordinatorRegistry: '0x1084b6a398e47907bae43fec3ff4b677db6e4fee',
        coordinator: NULL_ADDRESS,
        multiAssetProxy: '0xb34cde0ad3a83d04abebc0b66e75196f22216621',
        staticCallProxy: '0xe1b97e47aa3796276033a5341e884d2ba46b6ac1',
        erc1155Proxy: '0x19bb6caa3bc34d39e5a23cedfa3e6c7e7f3c931d',
        devUtils: '0xcfc66b8e75e8f075c3e1d61e6487d73dfe35d808',
        zrxVault: '0xa5bf6ac73bc40790fc6ffc9dbbbce76c9176e224',
        staking: '0x344d4f661a82afdd84d31456c291822d90d5dc3a',
        stakingProxy: '0xc6ad5277ea225ac05e271eb14a7ebb480cd9dd9f',
        erc20BridgeProxy: '0x31b8653642110f17bdb1f719901d7e7d49b08141',
    },
    42: {
        erc20Proxy: '0xf1ec01d6236d3cd881a0bf0130ea25fe4234003e',
        erc721Proxy: '0x2a9127c745688a165106c11cd4d647d2220af821',
        zrxToken: '0x2002d3812f58e35f0ea1ffbf80a75a38c32175fa',
        etherToken: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
        exchangeV2: '0x30589010550762d2f0d06f650d8e8b6ade6dbf4b',
        exchange: '0xca8b1626b3b7a0da722ca9f264c4630c7d34d3b8',
        assetProxyOwner: NULL_ADDRESS,
        zeroExGovernor: '0x3654e5363cd75c8974c76208137df9691e820e97',
        forwarder: '0x4c4edb103a6570fa4b58a309d7ff527b7d9f7cf2',
        orderValidator: NULL_ADDRESS,
        dutchAuction: NULL_ADDRESS,
        coordinatorRegistry: '0x09fb99968c016a3ff537bf58fb3d9fe55a7975d5',
        coordinator: NULL_ADDRESS,
        multiAssetProxy: '0xf6313a772c222f51c28f2304c0703b8cf5428fd8',
        staticCallProxy: '0x48e94bdb9033640d45ea7c721e25f380f8bffa43',
        erc1155Proxy: '0x64517fa2b480ba3678a2a3c0cf08ef7fd4fad36f',
        devUtils: '0xb1863ac46ae23ec55d6eeb8ecc8815655ee638a8',
        zrxVault: '0xf36eabdfe986b35b62c8fd5a98a7f2aebb79b291',
        staking: '0x89150f5eed50b3528f79bfb539f29d727f92821c',
        stakingProxy: '0xbab9145f1d57cd4bb0c9aa2d1ece0a5b6e734d34',
        erc20BridgeProxy: '0xfb2dd2a1366de37f7241c83d47da58fd503e2c64',
    },
    // NetworkId 50 represents our Ganache snapshot generated from migrations.
    50: {
        erc20Proxy: '0x1dc4c1cefef38a777b15aa20260a54e584b16c48',
        erc721Proxy: '0x1d7022f5b17d2f8b695918fb48fa1089c9f85401',
        erc1155Proxy: '0x6a4a62e5a7ed13c361b176a5f62c2ee620ac0df8',
        zrxToken: '0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
        etherToken: '0x0b1ba0af832d7c05fd64161e0db78e85978e8082',
        exchangeV2: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
        exchange: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
        zeroExGovernor: NULL_ADDRESS,
        assetProxyOwner: NULL_ADDRESS,
        forwarder: NULL_ADDRESS,
        orderValidator: NULL_ADDRESS,
        dutchAuction: NULL_ADDRESS,
        coordinatorRegistry: '0x1941ff73d1154774d87521d2d0aaad5d19c8df60',
        coordinator: NULL_ADDRESS,
        multiAssetProxy: '0xcfc18cec799fbd1793b5c43e773c98d4d61cc2db',
        staticCallProxy: '0x6dfff22588be9b3ef8cf0ad6dc9b84796f9fb45f',
        devUtils: '0x38ef19fdf8e8415f18c307ed71967e19aac28ba1',
        zrxVault: NULL_ADDRESS,
        staking: NULL_ADDRESS,
        stakingProxy: NULL_ADDRESS,
        erc20BridgeProxy: NULL_ADDRESS,
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
    if (networkToAddresses[networkId] === undefined) {
        throw new Error(`Unknown network id (${networkId}). No known 0x contracts have been deployed on this network.`);
    }
    return networkToAddresses[networkId];
}
