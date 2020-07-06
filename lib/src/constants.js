"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
var ERC20_METHOD_ABI = {
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
var ERC721_METHOD_ABI = {
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
var MULTI_ASSET_METHOD_ABI = {
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
var ERC1155_METHOD_ABI = {
    constant: false,
    inputs: [
        { name: 'tokenAddress', type: 'address' },
        { name: 'tokenIds', type: 'uint256[]' },
        { name: 'tokenValues', type: 'uint256[]' },
        { name: 'callbackData', type: 'bytes' },
    ],
    name: 'ERC1155Assets',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};
var STATIC_CALL_METHOD_ABI = {
    constant: false,
    inputs: [
        { name: 'callTarget', type: 'address' },
        { name: 'staticCallData', type: 'bytes' },
        { name: 'callResultHash', type: 'bytes32' },
    ],
    name: 'StaticCall',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
};
exports.constants = {
    NULL_ADDRESS: utils_1.NULL_ADDRESS,
    FAKED_PROVIDER: { isEIP1193: true },
    NULL_BYTES: utils_1.NULL_BYTES,
    NULL_ERC20_ASSET_DATA: '0xf47261b00000000000000000000000000000000000000000000000000000000000000000',
    // tslint:disable-next-line:custom-no-magic-numbers
    UNLIMITED_ALLOWANCE_IN_BASE_UNITS: new utils_1.BigNumber(2).pow(256).minus(1),
    TESTRPC_CHAIN_ID: 1337,
    ADDRESS_LENGTH: 20,
    ERC20_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX: 74,
    ERC721_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX: 138,
    ERC1155_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX: 266,
    MULTI_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX: 138,
    STATIC_CALL_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX: 202,
    SELECTOR_CHAR_LENGTH_WITH_PREFIX: 10,
    INFINITE_TIMESTAMP_SEC: new utils_1.BigNumber(2524604400),
    ZERO_AMOUNT: new utils_1.BigNumber(0),
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
            { name: 'makerFeeAssetData', type: 'bytes' },
            { name: 'takerFeeAssetData', type: 'bytes' },
        ],
    },
    EXCHANGE_ZEROEX_TRANSACTION_SCHEMA: {
        name: 'ZeroExTransaction',
        parameters: [
            { name: 'salt', type: 'uint256' },
            { name: 'expirationTimeSeconds', type: 'uint256' },
            { name: 'gasPrice', type: 'uint256' },
            { name: 'signerAddress', type: 'address' },
            { name: 'data', type: 'bytes' },
        ],
    },
    COORDINATOR_DOMAIN_NAME: '0x Protocol Coordinator',
    COORDINATOR_DOMAIN_VERSION: '3.0.0',
    COORDINATOR_APPROVAL_SCHEMA: {
        name: 'CoordinatorApproval',
        parameters: [
            { name: 'txOrigin', type: 'address' },
            { name: 'transactionHash', type: 'bytes32' },
            { name: 'transactionSignature', type: 'bytes' },
        ],
    },
    ERC20_METHOD_ABI: ERC20_METHOD_ABI,
    ERC721_METHOD_ABI: ERC721_METHOD_ABI,
    MULTI_ASSET_METHOD_ABI: MULTI_ASSET_METHOD_ABI,
    ERC1155_METHOD_ABI: ERC1155_METHOD_ABI,
    STATIC_CALL_METHOD_ABI: STATIC_CALL_METHOD_ABI,
    IS_VALID_WALLET_SIGNATURE_MAGIC_VALUE: '0xb0671381',
    IS_VALID_VALIDATOR_SIGNATURE_MAGIC_VALUE: '0x42b38674',
    /*
     * The pseudo-token address for ETH used by the Exchange Proxy's `tranformERC20()`.
     */
    ETH_TOKEN_ADDRESS: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
};
//# sourceMappingURL=constants.js.map