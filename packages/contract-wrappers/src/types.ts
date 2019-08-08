import { ContractAddresses } from '@0x/contract-addresses';
import { BigNumber } from '@0x/utils';

import { ContractEventArg, DecodedLogArgs, LogWithDecodedArgs } from 'ethereum-types';

export interface DecodedLogEvent<ArgsType extends DecodedLogArgs> {
    isRemoved: boolean;
    log: LogWithDecodedArgs<ArgsType>;
}

export type EventCallback<ArgsType extends DecodedLogArgs> = (
    err: null | Error,
    log?: DecodedLogEvent<ArgsType>,
) => void;

export interface TxOpts {
    from: string;
    gas?: number;
    value?: BigNumber;
    gasPrice?: BigNumber;
}

export interface IndexedFilterValues {
    [index: string]: ContractEventArg;
}

/**
 * networkId: The id of the underlying ethereum network your provider is connected to. (1-mainnet, 3-ropsten, 4-rinkeby, 42-kovan, 50-testrpc)
 * gasPrice: Gas price to use with every transaction
 * contractAddresses: The address of all contracts to use. Defaults to the known addresses based on networkId.
 * blockPollingIntervalMs: The interval to use for block polling in event watching methods (defaults to 1000)
 */
export interface ContractWrappersConfig {
    networkId: number;
    gasPrice?: BigNumber;
    contractAddresses?: ContractAddresses;
    blockPollingIntervalMs?: number;
}

/**
 * gasPrice: Gas price in Wei to use for a transaction
 * gasLimit: The amount of gas to send with a transaction (in Gwei)
 * nonce: The nonce to use for a transaction. If not specified, it defaults to the next incremented nonce.
 */
export interface TransactionOpts {
    gasPrice?: BigNumber;
    gasLimit?: number;
    nonce?: number;
}

/**
 * shouldValidate: Flag indicating whether the library should make attempts to validate a transaction before
 * broadcasting it. For example, order has a valid signature, maker has sufficient funds, etc. Default=true.
 */
export interface OrderTransactionOpts extends TransactionOpts {
    shouldValidate?: boolean;
}

export interface OrderInfo {
    orderStatus: OrderStatus;
    orderHash: string;
    orderTakerAssetFilledAmount: BigNumber;
}

export enum OrderStatus {
    Invalid = 0,
    InvalidMakerAssetAmount,
    InvalidTakerAssetAmount,
    Fillable,
    Expired,
    FullyFilled,
    Cancelled,
}

export { CoordinatorServerCancellationResponse, CoordinatorServerError } from './utils/coordinator_server_types';

export interface CoordinatorTransaction {
    salt: BigNumber;
    signerAddress: string;
    data: string;
}
