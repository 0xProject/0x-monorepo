import * as ethUtil from 'ethereumjs-util';

const DUMMY_TOKEN_NAME = '';
const DUMMY_TOKEN_SYMBOL = '';
const DUMMY_TOKEN_DECIMALS = 18;
const DUMMY_TOKEN_TOTAL_SUPPLY = 0;
const TESTRPC_INITIAL_BALANCE_HEX = parseInt('100000000000000000000', 16);

export const constants = {
    NULL_BYTES: '0x',
    INVALID_OPCODE: 'invalid opcode',
    REVERT: 'revert',
    TESTRPC_NETWORK_ID: 50,
    MAX_ETHERTOKEN_WITHDRAW_GAS: 43000,
    MAX_TOKEN_TRANSFERFROM_GAS: 80000,
    MAX_TOKEN_APPROVE_GAS: 60000,
    DUMMY_TOKEN_ARGS: [DUMMY_TOKEN_NAME, DUMMY_TOKEN_SYMBOL, DUMMY_TOKEN_DECIMALS, DUMMY_TOKEN_TOTAL_SUPPLY],
    TESTRPC_PORT: 8545,
    TESTRPC_ACCOUNTS: [
        {
            balance: TESTRPC_INITIAL_BALANCE_HEX,
            secretKey: ethUtil.sha3('secret0'),
        },
        {
            balance: TESTRPC_INITIAL_BALANCE_HEX,
            secretKey: ethUtil.sha3('secret1'),
        },
        {
            balance: TESTRPC_INITIAL_BALANCE_HEX,
            secretKey: ethUtil.sha3('secret2'),
        },
        {
            balance: TESTRPC_INITIAL_BALANCE_HEX,
            secretKey: ethUtil.sha3('secret3'),
        },
    ],
};
