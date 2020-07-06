import { BigNumber } from '@0x/utils';
import { MethodAbi } from 'ethereum-types';
export declare const constants: {
    NULL_ADDRESS: string;
    FAKED_PROVIDER: {
        isEIP1193: boolean;
    };
    NULL_BYTES: string;
    NULL_ERC20_ASSET_DATA: string;
    UNLIMITED_ALLOWANCE_IN_BASE_UNITS: BigNumber;
    TESTRPC_CHAIN_ID: number;
    ADDRESS_LENGTH: number;
    ERC20_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX: number;
    ERC721_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX: number;
    ERC1155_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX: number;
    MULTI_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX: number;
    STATIC_CALL_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX: number;
    SELECTOR_CHAR_LENGTH_WITH_PREFIX: number;
    INFINITE_TIMESTAMP_SEC: BigNumber;
    ZERO_AMOUNT: BigNumber;
    EXCHANGE_DOMAIN_NAME: string;
    EXCHANGE_DOMAIN_VERSION: string;
    DEFAULT_DOMAIN_SCHEMA: {
        name: string;
        parameters: {
            name: string;
            type: string;
        }[];
    };
    EXCHANGE_ORDER_SCHEMA: {
        name: string;
        parameters: {
            name: string;
            type: string;
        }[];
    };
    EXCHANGE_ZEROEX_TRANSACTION_SCHEMA: {
        name: string;
        parameters: {
            name: string;
            type: string;
        }[];
    };
    COORDINATOR_DOMAIN_NAME: string;
    COORDINATOR_DOMAIN_VERSION: string;
    COORDINATOR_APPROVAL_SCHEMA: {
        name: string;
        parameters: {
            name: string;
            type: string;
        }[];
    };
    ERC20_METHOD_ABI: MethodAbi;
    ERC721_METHOD_ABI: MethodAbi;
    MULTI_ASSET_METHOD_ABI: MethodAbi;
    ERC1155_METHOD_ABI: MethodAbi;
    STATIC_CALL_METHOD_ABI: MethodAbi;
    IS_VALID_WALLET_SIGNATURE_MAGIC_VALUE: string;
    IS_VALID_VALIDATOR_SIGNATURE_MAGIC_VALUE: string;
    ETH_TOKEN_ADDRESS: string;
};
//# sourceMappingURL=constants.d.ts.map