import { BigNumber } from '@0x/utils';
import { MethodAbi } from 'ethereum-types';

const ERC20_METHOD_ABI: MethodAbi = {
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
};

const ERC721_METHOD_ABI: MethodAbi = {
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
};

const MULTI_ASSET_METHOD_ABI: MethodAbi = {
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
};

export const constants = {
    NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
    NULL_BYTES: '0x',
    NULL_ERC20_ASSET_DATA: '0xf47261b00000000000000000000000000000000000000000000000000000000000000000',
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
    EXCHANGE_DOMAIN_NAME: '0x Protocol',
    EXCHANGE_DOMAIN_VERSION: '3.0.0',
    DEFAULT_DOMAIN_SCHEMA: {
        name: 'EIP712Domain',
        parameters: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ],
    },
    EXCHANGE_ORDER_SCHEMA: {
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
    EXCHANGE_ZEROEX_TRANSACTION_SCHEMA: {
        name: 'ZeroExTransaction',
        parameters: [
            { name: 'salt', type: 'uint256' },
            { name: 'signerAddress', type: 'address' },
            { name: 'data', type: 'bytes' },
        ],
    },
    COORDINATOR_DOMAIN_NAME: '0x Protocol Coordinator',
    COORDINATOR_DOMAIN_VERSION: '2.0.0',
    COORDINATOR_APPROVAL_SCHEMA: {
        name: 'CoordinatorApproval',
        parameters: [
            { name: 'txOrigin', type: 'address' },
            { name: 'transactionHash', type: 'bytes32' },
            { name: 'transactionSignature', type: 'bytes' },
            { name: 'approvalExpirationTimeSeconds', type: 'uint256' },
        ],
    },
    ERC20_METHOD_ABI,
    ERC721_METHOD_ABI,
    MULTI_ASSET_METHOD_ABI,
};
