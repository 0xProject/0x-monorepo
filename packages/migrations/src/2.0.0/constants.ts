import { BigNumber } from '@0xproject/utils';

export const constants = {
    ASSET_PROXY_OWNER_OWNERS: [
        '0x257619b7155d247e43c8b6d90c8c17278ae481f0',
        '0x5ee2a00f8f01d099451844af7f894f26a57fcbf2',
        '0x894d623e0e0e8ed12c4a73dada999e275684a37d',
    ],
    ASSET_PROXY_OWNER_REQUIRED_CONFIRMATIONS: new BigNumber(2),
    ASSET_PROXY_OWNER_SECONDS_TIMELOCKED: new BigNumber(1209600),
    WETH_ADDRESS: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    ZRX_ADDRESS: '0xe41d2489571d322189246dafa5ebde1f4699f498',
};
