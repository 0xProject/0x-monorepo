import { BigNumber } from '@0x/utils';

export const constants = {
    NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
    NULL_BYTES: '0x',
    // tslint:disable-next-line:custom-no-magic-numbers
    UNLIMITED_ALLOWANCE_IN_BASE_UNITS: new BigNumber(2).pow(256).minus(1),
    TESTRPC_NETWORK_ID: 50,
    ADDRESS_LENGTH: 20,
    ERC20_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX: 74,
    ERC721_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX: 136,
    MULTI_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX: 266,
    SELECTOR_CHAR_LENGTH_WITH_PREFIX: 10,
    INFINITE_TIMESTAMP_SEC: new BigNumber(2524604400), // Close to infinite
    ZERO_AMOUNT: new BigNumber(0),
    EIP712_DOMAIN_NAME: '0x Protocol',
    EIP712_DOMAIN_VERSION: '2',
    EIP712_DOMAIN_SCHEMA: {
        name: 'EIP712Domain',
        parameters: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'verifyingContract', type: 'address' },
        ],
    },
    EIP712_ORDER_SCHEMA: {
        name: 'Order',
        parameters: [
            { name: 'makerAddress', type: 'address' },
            { name: 'takerAddress', type: 'address' },
            { name: 'feeRecipientAddress', type: 'address' },
            { name: 'senderAddress', type: 'address' },
            { name: 'makerAssetAmount', type: 'uint256' },
            { name: 'takerAssetAmount', type: 'uint256' },
            { name: 'makerFee', type: 'uint256' },
            { name: 'takerFee', type: 'uint256' },
            { name: 'expirationTimeSeconds', type: 'uint256' },
            { name: 'salt', type: 'uint256' },
            { name: 'makerAssetData', type: 'bytes' },
            { name: 'takerAssetData', type: 'bytes' },
        ],
    },
    EIP712_ZEROEX_TRANSACTION_SCHEMA: {
        name: 'ZeroExTransaction',
        parameters: [
            { name: 'salt', type: 'uint256' },
            { name: 'signerAddress', type: 'address' },
            { name: 'data', type: 'bytes' },
        ],
    },
    ERC20_METHOD_ABI: {
        constant: false,
        inputs: [
            {
                name: 'tokenContract',
                type: 'address',
            },
        ],
        name: 'ERC20Token',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    ERC721_METHOD_ABI: {
        constant: false,
        inputs: [
            {
                name: 'tokenContract',
                type: 'address',
            },
            {
                name: 'tokenId',
                type: 'uint256',
            },
        ],
        name: 'ERC721Token',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    MULTI_ASSET_METHOD_ABI: {
        constant: false,
        inputs: [
            {
                name: 'amounts',
                type: 'uint256[]',
            },
            {
                name: 'nestedAssetData',
                type: 'bytes[]',
            },
        ],
        name: 'MultiAsset',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
};
