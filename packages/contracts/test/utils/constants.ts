import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

const TESTRPC_PRIVATE_KEYS_STRINGS = [
    '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d',
    '0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72',
    '0xdf02719c4df8b9b8ac7f551fcb5d9ef48fa27eef7a66453879f4d8fdc6e78fb1',
    '0xff12e391b79415e941a94de3bf3a9aee577aed0731e297d5cfa0b8a1e02fa1d0',
    '0x752dd9cf65e68cfaba7d60225cbdbc1f4729dd5e5507def72815ed0d8abc6249',
    '0xefb595a0178eb79a8df953f87c5148402a224cdf725e88c0146727c6aceadccd',
    '0x83c6d2cc5ddcf9711a6d59b417dc20eb48afd58d45290099e5987e3d768f328f',
    '0xbb2d3f7c9583780a7d3904a2f55d792707c345f21de1bacb2d389934d82796b2',
    '0xb2fd4d29c1390b71b8795ae81196bfd60293adf99f9d32a0aff06288fcdac55f',
    '0x23cb7121166b9a2f93ae0b7c05bde02eae50d64449b2cbb42bc84e9d38d6cc89',
];

export const constants = {
    BASE_16: 16,
    INVALID_OPCODE: 'invalid opcode',
    TESTRPC_NETWORK_ID: 50,
    // Note(albrow): In practice V8 and most other engines limit the minimum
    // interval for setInterval to 10ms. We still set it to 0 here in order to
    // ensure we always use the minimum interval.
    AWAIT_TRANSACTION_MINED_MS: 0,
    MAX_ETHERTOKEN_WITHDRAW_GAS: 43000,
    MAX_EXECUTE_TRANSACTION_GAS: 1000000,
    MAX_TOKEN_TRANSFERFROM_GAS: 80000,
    MAX_TOKEN_APPROVE_GAS: 60000,
    MAX_TRANSFER_FROM_GAS: 150000,
    DUMMY_TOKEN_NAME: '',
    DUMMY_TOKEN_SYMBOL: '',
    DUMMY_TOKEN_DECIMALS: new BigNumber(18),
    DUMMY_TOKEN_TOTAL_SUPPLY: new BigNumber(0),
    NULL_BYTES: '0x',
    NUM_DUMMY_ERC20_TO_DEPLOY: 3,
    NUM_DUMMY_ERC721_TO_DEPLOY: 1,
    NUM_ERC721_TOKENS_TO_MINT: 2,
    NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
    UNLIMITED_ALLOWANCE_IN_BASE_UNITS: new BigNumber(2).pow(256).minus(1),
    TESTRPC_PRIVATE_KEYS: _.map(TESTRPC_PRIVATE_KEYS_STRINGS, privateKeyString => ethUtil.toBuffer(privateKeyString)),
    INITIAL_ERC20_BALANCE: Web3Wrapper.toBaseUnitAmount(new BigNumber(10000), 18),
    INITIAL_ERC20_ALLOWANCE: Web3Wrapper.toBaseUnitAmount(new BigNumber(10000), 18),
    STATIC_ORDER_PARAMS: {
        makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
        takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
        makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 18),
        takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 18),
    },
    WORD_LENGTH: 32,
    ZERO_AMOUNT: new BigNumber(0),
    PERCENTAGE_DENOMINATOR: new BigNumber(10).pow(18),
    FUNCTIONS_WITH_MUTEX: [
        'FILL_ORDER',
        'FILL_OR_KILL_ORDER',
        'BATCH_FILL_ORDERS',
        'BATCH_FILL_OR_KILL_ORDERS',
        'MARKET_BUY_ORDERS',
        'MARKET_SELL_ORDERS',
        'MATCH_ORDERS',
        'CANCEL_ORDER',
        'BATCH_CANCEL_ORDERS',
        'CANCEL_ORDERS_UP_TO',
        'SET_SIGNATURE_VALIDATOR_APPROVAL',
    ],
};
