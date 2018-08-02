import { BigNumber } from '@0xproject/utils';

export const constants = {
    NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
    NULL_BYTES: '0x',
    // tslint:disable-next-line:custom-no-magic-numbers
    UNLIMITED_ALLOWANCE_IN_BASE_UNITS: new BigNumber(2).pow(256).minus(1),
    TESTRPC_NETWORK_ID: 50,
    ADDRESS_LENGTH: 20,
    ERC20_ASSET_DATA_BYTE_LENGTH: 36,
    ERC721_ASSET_DATA_MINIMUM_BYTE_LENGTH: 53,
    SELECTOR_LENGTH: 4,
    BASE_16: 16,
    INFINITE_TIMESTAMP_SEC: new BigNumber(2524604400), // Close to infinite,
    ZERO_AMOUNT: new BigNumber(0),
};
