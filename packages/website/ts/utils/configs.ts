import * as _ from 'lodash';
import {
    ContractAddresses,
    Environments,
    Networks,
    OutdatedWrappedEtherByNetworkId,
    PublicNodeUrlsByNetworkId,
    SmartContractDocSections,
} from 'ts/types';

const BASE_URL = window.location.origin;
const isDevelopment = _.includes(
    ['https://0xproject.localhost:3572', 'https://localhost:3572', 'https://127.0.0.1'],
    BASE_URL,
);
const INFURA_API_KEY = 'T5WSC8cautR4KXyYgsRs';

export const configs = {
    BACKEND_BASE_URL: 'https://website-api.0xproject.com',
    BASE_URL,
    BITLY_ACCESS_TOKEN: 'ffc4c1a31e5143848fb7c523b39f91b9b213d208',
    CONTRACT_ADDRESS: {
        '1.0.0': {
            [Networks.Mainnet]: {
                [SmartContractDocSections.Exchange]: '0x12459c951127e0c374ff9105dda097662a027093',
                [SmartContractDocSections.TokenTransferProxy]: '0x8da0d80f5007ef1e431dd2127178d224e32c2ef4',
                [SmartContractDocSections.ZRXToken]: '0xe41d2489571d322189246dafa5ebde1f4699f498',
                [SmartContractDocSections.TokenRegistry]: '0x926a74c5c36adf004c87399e65f75628b0f98d2c',
            },
            [Networks.Ropsten]: {
                [SmartContractDocSections.Exchange]: '0x479cc461fecd078f766ecc58533d6f69580cf3ac',
                [SmartContractDocSections.TokenTransferProxy]: '0x4e9aad8184de8833365fea970cd9149372fdf1e6',
                [SmartContractDocSections.ZRXToken]: '0xa8e9fa8f91e5ae138c74648c9c304f1c75003a8d',
                [SmartContractDocSections.TokenRegistry]: '0x6b1a50f0bb5a7995444bd3877b22dc89c62843ed',
            },
            [Networks.Kovan]: {
                [SmartContractDocSections.Exchange]: '0x90fe2af704b34e0224bf2299c838e04d4dcf1364',
                [SmartContractDocSections.TokenTransferProxy]: '0x087Eed4Bc1ee3DE49BeFbd66C662B434B15d49d4',
                [SmartContractDocSections.ZRXToken]: '0x6ff6c0ff1d68b964901f986d4c9fa3ac68346570',
                [SmartContractDocSections.TokenRegistry]: '0xf18e504561f4347bea557f3d4558f559dddbae7f',
            },
            [Networks.Rinkeby]: {
                [SmartContractDocSections.Exchange]: '0x1d16ef40fac01cec8adac2ac49427b9384192c05',
                [SmartContractDocSections.TokenTransferProxy]: '0xa8e9fa8f91e5ae138c74648c9c304f1c75003a8d',
                [SmartContractDocSections.ZRXToken]: '0x00f58d6d585f84b2d7267940cede30ce2fe6eae8',
                [SmartContractDocSections.TokenRegistry]: '0x4e9aad8184de8833365fea970cd9149372fdf1e6',
            },
        },
    } as ContractAddresses,
    DEFAULT_DERIVATION_PATH: `44'/60'/0'`,
    // WARNING: ZRX & WETH MUST always be default trackedTokens
    DEFAULT_TRACKED_TOKEN_SYMBOLS: ['WETH', 'ZRX'],
    DOMAIN_STAGING: 'staging-0xproject.s3-website-us-east-1.amazonaws.com',
    DOMAIN_DEVELOPMENT: '0xproject.localhost:3572',
    DOMAIN_PRODUCTION: '0xproject.com',
    ENVIRONMENT: isDevelopment ? Environments.DEVELOPMENT : Environments.PRODUCTION,
    ICON_URL_BY_SYMBOL: {
        REP: '/images/token_icons/augur.png',
        DGD: '/images/token_icons/digixdao.png',
        WETH: '/images/token_icons/ether_erc20.png',
        MLN: '/images/token_icons/melon.png',
        GNT: '/images/token_icons/golem.png',
        MKR: '/images/token_icons/makerdao.png',
        ZRX: '/images/token_icons/zero_ex.png',
        ANT: '/images/token_icons/aragon.png',
        BNT: '/images/token_icons/bancor.png',
        BAT: '/images/token_icons/basicattentiontoken.png',
        CVC: '/images/token_icons/civic.png',
        EOS: '/images/token_icons/eos.png',
        FUN: '/images/token_icons/funfair.png',
        GNO: '/images/token_icons/gnosis.png',
        ICN: '/images/token_icons/iconomi.png',
        OMG: '/images/token_icons/omisego.png',
        SNT: '/images/token_icons/status.png',
        STORJ: '/images/token_icons/storjcoinx.png',
        PAY: '/images/token_icons/tenx.png',
        QTUM: '/images/token_icons/qtum.png',
        DNT: '/images/token_icons/district0x.png',
        SNGLS: '/images/token_icons/singularity.png',
        EDG: '/images/token_icons/edgeless.png',
        '1ST': '/images/token_icons/firstblood.jpg',
        WINGS: '/images/token_icons/wings.png',
        BQX: '/images/token_icons/bitquence.png',
        LUN: '/images/token_icons/lunyr.png',
        RLC: '/images/token_icons/iexec.png',
        MCO: '/images/token_icons/monaco.png',
        ADT: '/images/token_icons/adtoken.png',
        CFI: '/images/token_icons/cofound-it.png',
        ROL: '/images/token_icons/etheroll.png',
        WGNT: '/images/token_icons/golem.png',
        MTL: '/images/token_icons/metal.png',
        NMR: '/images/token_icons/numeraire.png',
        SAN: '/images/token_icons/santiment.png',
        TAAS: '/images/token_icons/taas.png',
        TKN: '/images/token_icons/tokencard.png',
        TRST: '/images/token_icons/trust.png',
    } as { [symbol: string]: string },
    IS_MAINNET_ENABLED: true,
    LAST_LOCAL_STORAGE_FILL_CLEARANCE_DATE: '2017-11-22',
    LAST_LOCAL_STORAGE_TRACKED_TOKEN_CLEARANCE_DATE: '2017-12-19',
    // NEW_WRAPPED_ETHERS is temporary until we remove the SHOULD_DEPRECATE_OLD_WETH_TOKEN flag
    // and add the new WETHs to the tokenRegistry
    NEW_WRAPPED_ETHERS: {
        1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        42: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
    } as { [networkId: string]: string },
    OUTDATED_WRAPPED_ETHERS: [
        {
            42: {
                address: '0x05d090b51c40b020eab3bfcb6a2dff130df22e9c',
                timestampMsRange: {
                    startTimestampMs: 1502455607000,
                    endTimestampMs: 1513790926000,
                },
            },
            1: {
                address: '0x2956356cd2a2bf3202f771f50d3d14a367b48070',
                timestampMsRange: {
                    startTimestampMs: 1502455607000,
                    endTimestampMs: 1513790926000,
                },
            },
        },
    ] as OutdatedWrappedEtherByNetworkId[],
    // The order matters. We first try first node and only then fall back to others.
    PUBLIC_NODE_URLS_BY_NETWORK_ID: {
        [1]: [`https://mainnet.infura.io/${INFURA_API_KEY}`, 'https://mainnet.0xproject.com'],
        [42]: [`https://kovan.infura.io/${INFURA_API_KEY}`, 'https://kovan.0xproject.com'],
        [3]: [`https://ropsten.infura.io/${INFURA_API_KEY}`],
        [4]: [`https://rinkeby.infura.io/${INFURA_API_KEY}`],
    } as PublicNodeUrlsByNetworkId,
    SHOULD_DEPRECATE_OLD_WETH_TOKEN: true,
    SYMBOLS_OF_MINTABLE_KOVAN_TOKENS: ['MKR', 'MLN', 'GNT', 'DGD', 'REP'],
    SYMBOLS_OF_MINTABLE_RINKEBY_ROPSTEN_TOKENS: [
        'TKN0',
        'TKN1',
        'TKN2',
        'TKN3',
        'TKN4',
        'TKN5',
        'TKN6',
        'TKN7',
        'TKN8',
        'TKN9',
        'TKN10',
        'TKN11',
        'TKN12',
        'TKN13',
        'TKN14',
        'TKN15',
        'TKN16',
        'TKN17',
        'TKN18',
        'TKN19',
    ],
};
