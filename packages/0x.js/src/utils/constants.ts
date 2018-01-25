import { BigNumber } from '@0xproject/utils';

export const constants = {
    NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
    TESTRPC_NETWORK_ID: 50,
    MAX_DIGITS_IN_UNSIGNED_256_INT: 78,
    INVALID_JUMP_PATTERN: 'invalid JUMP at',
    OUT_OF_GAS_PATTERN: 'out of gas',
    INVALID_TAKER_FORMAT: 'instance.taker is not of a type(s) string',
    UNLIMITED_ALLOWANCE_IN_BASE_UNITS: new BigNumber(2).pow(256).minus(1),
    DEFAULT_BLOCK_POLLING_INTERVAL: 1000,
};
