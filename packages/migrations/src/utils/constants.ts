import { BigNumber } from '@0x/utils';

export const constants = {
    ASSET_PROXY_OWNER_OWNERS: [
        '0x9df8137872ac09a8fee71d0da5c7539923fb9bf0',
        '0xcf34d44db312d188789f43a63d11cf2bebb4da15',
        '0x73fd50f2a6beac9cdac9fe87ef68a18edc415831',
    ],
    ASSET_PROXY_OWNER_TIMELOCK: new BigNumber(0),
    ASSET_PROXY_OWNER_CONFIRMATIONS: new BigNumber(1),
    ERC20_PROXY_ID: '0xf47261b0',
    ERC721_PROXY_ID: '0x02571792',
    NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
    KOVAN_RPC_URL: 'https://kovan.infura.io/',
    KOVAN_NETWORK_ID: 42,
    MAINNET_RPC_URL: 'https://mainnet.infura.io/',
    MAINNET_NETWORK_ID: 1,
};
