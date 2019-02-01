import { OutdatedWrappedEtherByNetworkId, PublicNodeUrlsByNetworkId } from 'ts/types';

const BASE_URL = window.location.origin;
const INFURA_API_KEY = 'T5WSC8cautR4KXyYgsRs';

export const configs = {
    AMOUNT_DISPLAY_PRECSION: 5,
    BACKEND_BASE_PROD_URL: 'https://website-api.0xproject.com',
    BACKEND_BASE_STAGING_URL: 'https://staging-website-api.0xproject.com',
    BASE_URL,
    BITLY_ACCESS_TOKEN: 'ffc4c1a31e5143848fb7c523b39f91b9b213d208',
    DEFAULT_DERIVATION_PATH: `44'/60'/0'`,
    // WARNING: ZRX & WETH MUST always be default trackedTokens
    DEFAULT_TRACKED_TOKEN_SYMBOLS: ['WETH', 'ZRX'],
    DOMAIN_STAGING: 'staging-0xproject.s3-website-us-east-1.amazonaws.com',
    DOMAIN_DOGFOOD: 'dogfood.0xproject.com',
    DOMAINS_DEVELOPMENT: ['0xproject.localhost:3572', 'localhost:3572', '127.0.0.1'],
    DOMAIN_PRODUCTION: '0xproject.com',
    GOOGLE_ANALYTICS_ID: 'UA-98720122-1',
    LAST_LOCAL_STORAGE_FILL_CLEARANCE_DATE: '2017-11-22',
    LAST_LOCAL_STORAGE_TRACKED_TOKEN_CLEARANCE_DATE: '2018-9-7',
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
    SYMBOLS_OF_MINTABLE_KOVAN_TOKENS: ['ZRX', 'MKR', 'MLN', 'GNT', 'DGD', 'REP'],
    SYMBOLS_OF_MINTABLE_ROPSTEN_TOKENS: ['ZRX', 'MKR', 'MLN', 'GNT', 'DGD', 'REP'],
};
