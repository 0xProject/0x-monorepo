import { BigNumber } from '@0x/utils';

export const constants = {
    NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
    NULL_BYTES: '0x',
    TESTRPC_NETWORK_ID: 50,
    INVALID_JUMP_PATTERN: 'invalid JUMP at',
    REVERT: 'revert',
    OUT_OF_GAS_PATTERN: 'out of gas',
    INVALID_TAKER_FORMAT: 'instance.taker is not of a type(s) string',
    // tslint:disable-next-line:custom-no-magic-numbers
    UNLIMITED_ALLOWANCE_IN_BASE_UNITS: new BigNumber(2).pow(256).minus(1),
    DEFAULT_BLOCK_POLLING_INTERVAL: 1000,
    ZERO_AMOUNT: new BigNumber(0),
    ONE_AMOUNT: new BigNumber(1),
    ETHER_TOKEN_DECIMALS: 18,
    METAMASK_USER_DENIED_SIGNATURE_PATTERN: 'User denied transaction signature',
    TRUST_WALLET_USER_DENIED_SIGNATURE_PATTERN: 'cancelled',
};
