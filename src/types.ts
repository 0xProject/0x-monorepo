import * as _ from 'lodash';

// Utility function to create a K:V from a list of strings
// Adapted from: https://basarat.gitbooks.io/typescript/content/docs/types/literal-types.html
function strEnum(values: string[]): {[key: string]: string} {
    return _.reduce(values, (result, key) => {
        result[key] = key;
        return result;
    }, Object.create(null));
}

export const ZeroExError = strEnum([
  'CONTRACT_DOES_NOT_EXIST',
  'UNHANDLED_ERROR',
  'USER_HAS_NO_ASSOCIATED_ADDRESSES',
  'INVALID_SIGNATURE',
  'CONTRACT_NOT_DEPLOYED_ON_NETWORK',
]);
export type ZeroExError = keyof typeof ZeroExError;

/**
 * Elliptic Curve signature
 */
export interface ECSignature {
    v: number;
    r: string;
    s: string;
}

export type OrderAddresses = [string, string, string, string, string];

export type OrderValues = [BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber,
                           BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber];

export interface ExchangeContract {
    isValidSignature: any;
    getUnavailableValueT: {
        call: (orderHash: string) => BigNumber.BigNumber;
    };
    fill: {
        (orderAddresses: OrderAddresses, orderValues: OrderValues, fillAmount: BigNumber.BigNumber,
         shouldCheckTransfer: boolean, v: number, r: string, s: string, txOpts: TxOpts): ContractResponse;
        estimateGas: (orderAddresses: OrderAddresses, orderValues: OrderValues, fillAmount: BigNumber.BigNumber,
                      shouldCheckTransfer: boolean, v: number, r: string, s: string, txOpts: TxOpts) => number;
    };
    filled: {
        call: (orderHash: string) => BigNumber.BigNumber;
    };
    cancelled: {
        call: (orderHash: string) => BigNumber.BigNumber;
    };
}

export type EventCallbackAsync = (err: Error, event: ContractEvent) => Promise<void>;
export type EventCallbackSync = (err: Error, event: ContractEvent) => void;
export type EventCallback = EventCallbackSync|EventCallbackAsync;
export interface ContractEventObj {
    watch: (eventWatch: EventCallback) => void;
    stopWatching: () => void;
}
export type CreateContractEvent = (indexFilterValues: IndexFilterValues,
                                   subscriptionOpts: SubscriptionOpts) => ContractEventObj;
export interface ExchangeContract {
    isValidSignature: any;
    LogFill: CreateContractEvent;
    LogCancel: CreateContractEvent;
    LogError: CreateContractEvent;
}

export interface TokenContract {
    balanceOf: {
        call: (address: string) => Promise<BigNumber.BigNumber>;
    };
    allowance: {
        call: (ownerAddress: string, allowedAddress: string) => Promise<BigNumber.BigNumber>;
    };
    transfer: (to: string, amountInBaseUnits: BigNumber.BigNumber, txOpts: TxOpts) => Promise<boolean>;
    approve: (proxyAddress: string, amountInBaseUnits: BigNumber.BigNumber, txOpts: TxOpts) => void;
}

export interface TokenRegistryContract {
    getTokenMetaData: {
        call: (address: string) => Promise<TokenMetadata>;
    };
    getTokenAddresses: {
        call: () => Promise<string[]>;
    };
}

export const SolidityTypes = strEnum([
    'address',
    'uint256',
]);
export type SolidityTypes = keyof typeof SolidityTypes;

export enum ExchangeContractErrCodes {
    ERROR_FILL_EXPIRED, // Order has already expired
    ERROR_FILL_NO_VALUE, // Order has already been fully filled or cancelled
    ERROR_FILL_TRUNCATION, // Rounding error too large
    ERROR_FILL_BALANCE_ALLOWANCE, // Insufficient balance or allowance for token transfer
    ERROR_CANCEL_EXPIRED, // Order has already expired
    ERROR_CANCEL_NO_VALUE, // Order has already been fully filled or cancelled
}

export const ExchangeContractErrs = strEnum([
    'ORDER_EXPIRED',
    'ORDER_REMAINING_FILL_AMOUNT_ZERO',
    'ORDER_ROUNDING_ERROR',
    'ORDER_BALANCE_ALLOWANCE_ERROR',
]);
export type ExchangeContractErrs = keyof typeof ExchangeContractErrs;

export const FillOrderValidationErrs = strEnum([
    'FILL_AMOUNT_IS_ZERO',
    'NOT_A_TAKER',
    'EXPIRED',
    'NOT_ENOUGH_TAKER_BALANCE',
    'NOT_ENOUGH_TAKER_ALLOWANCE',
    'NOT_ENOUGH_MAKER_BALANCE',
    'NOT_ENOUGH_MAKER_ALLOWANCE',
]);
export type FillOrderValidationErrs = keyof typeof FillOrderValidationErrs;

export interface ContractResponse {
    logs: ContractEvent[];
}

export interface ContractEvent {
    logIndex: number;
    transactionIndex: number;
    transactionHash: string;
    blockHash: string;
    blockNumber: number;
    address: string;
    type: string;
    event: string;
    args: any;
}

export interface Order {
    maker: string;
    taker: string;
    makerFee: BigNumber.BigNumber;
    takerFee: BigNumber.BigNumber;
    makerTokenAmount: BigNumber.BigNumber;
    takerTokenAmount: BigNumber.BigNumber;
    makerTokenAddress: string;
    takerTokenAddress: string;
    salt: BigNumber.BigNumber;
    feeRecipient: string;
    expirationUnixTimestampSec: BigNumber.BigNumber;
}

export interface SignedOrder extends Order {
    ecSignature: ECSignature;
}

//                          [address, name, symbol, projectUrl, decimals, ipfsHash, swarmHash]
export type TokenMetadata = [string, string, string, string, BigNumber.BigNumber, string, string];

export interface Token {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    url: string;
}

export interface TxOpts {
    from: string;
    gas?: number;
}

export interface TokenAddressBySymbol {
    [symbol: string]: string;
}

export const ExchangeEvents = strEnum([
    'LogFill',
    'LogCancel',
    'LogError',
]);
export type ExchangeEvents = keyof typeof ExchangeEvents;

export interface IndexFilterValues {
    [index: string]: any;
}

export interface SubscriptionOpts {
    fromBlock: string|number;
    toBlock: string|number;
}

export type DoneCallback = (err?: Error) => void;
