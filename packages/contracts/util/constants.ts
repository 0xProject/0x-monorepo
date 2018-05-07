import { BigNumber } from '@0xproject/utils';

export const constants = {
    INVALID_OPCODE: 'invalid opcode',
    REVERT: 'revert',
    TESTRPC_NETWORK_ID: 50,
    MAX_ETHERTOKEN_WITHDRAW_GAS: 43000,
    MAX_TOKEN_TRANSFERFROM_GAS: 80000,
    MAX_TOKEN_APPROVE_GAS: 60000,
    DUMMY_TOKEN_NAME: '',
    DUMMY_TOKEN_SYMBOL: '',
    DUMMY_TOKEN_DECIMALS: new BigNumber(18),
    DUMMY_TOKEN_TOTAL_SUPPLY: new BigNumber(0),
};
