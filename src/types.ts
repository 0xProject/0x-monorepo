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
    'ZRX_NOT_IN_TOKEN_REGISTRY',
    'INSUFFICIENT_ALLOWANCE_FOR_TRANSFER',
    'INSUFFICIENT_BALANCE_FOR_TRANSFER',
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

export type EventCallbackAsync = (err: Error, event: ContractEvent) => Promise<void>;
export type EventCallbackSync = (err: Error, event: ContractEvent) => void;
export type EventCallback = EventCallbackSync|EventCallbackAsync;
export interface ContractEventObj {
    watch: (eventWatch: EventCallback) => void;
    stopWatching: () => void;
}
export type CreateContractEvent = (indexFilterValues: IndexFilterValues,
                                   subscriptionOpts: SubscriptionOpts) => ContractEventObj;
export interface ContractInstance {
    address: string;
}
export interface ExchangeContract extends ContractInstance {
    isValidSignature: {
        call: (signerAddressHex: string, dataHex: string, v: number, r: string, s: string,
               txOpts?: TxOpts) => Promise<boolean>;
    };
    LogFill: CreateContractEvent;
    LogCancel: CreateContractEvent;
    LogError: CreateContractEvent;
    ZRX: {
        call: () => Promise<string>;
    };
    getUnavailableValueT: {
        call: (orderHash: string) => BigNumber.BigNumber;
    };
    isRoundingError: {
        call: (takerTokenAmount: BigNumber.BigNumber, fillTakerAmount: BigNumber.BigNumber,
               makerTokenAmount: BigNumber.BigNumber, txOpts?: TxOpts) => Promise<boolean>;
    };
    fill: {
        (orderAddresses: OrderAddresses, orderValues: OrderValues, fillAmount: BigNumber.BigNumber,
         shouldCheckTransfer: boolean, v: number, r: string, s: string, txOpts?: TxOpts): ContractResponse;
        estimateGas: (orderAddresses: OrderAddresses, orderValues: OrderValues, fillAmount: BigNumber.BigNumber,
                      shouldCheckTransfer: boolean, v: number, r: string, s: string, txOpts?: TxOpts) => number;
    };
    cancel: {
        (orderAddresses: OrderAddresses, orderValues: OrderValues, cancelAmount: BigNumber.BigNumber,
         txOpts?: TxOpts): ContractResponse;
        estimateGas: (orderAddresses: OrderAddresses, orderValues: OrderValues, cancelAmount: BigNumber.BigNumber,
                      txOpts?: TxOpts) => number;
    };
    filled: {
        call: (orderHash: string) => BigNumber.BigNumber;
    };
    cancelled: {
        call: (orderHash: string) => BigNumber.BigNumber;
    };
    getOrderHash: {
        call: (orderAddresses: OrderAddresses, orderValues: OrderValues) => string;
    };
}

export interface TokenContract extends ContractInstance {
    balanceOf: {
        call: (address: string) => Promise<BigNumber.BigNumber>;
    };
    allowance: {
        call: (ownerAddress: string, allowedAddress: string) => Promise<BigNumber.BigNumber>;
    };
    transfer: (toAddress: string, amountInBaseUnits: BigNumber.BigNumber, txOpts?: TxOpts) => Promise<boolean>;
    transferFrom: (fromAddress: string, toAddress: string, amountInBaseUnits: BigNumber.BigNumber,
                   txOpts?: TxOpts) => Promise<boolean>;
    approve: (proxyAddress: string, amountInBaseUnits: BigNumber.BigNumber, txOpts?: TxOpts) => void;
}

export interface TokenRegistryContract extends ContractInstance {
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
    'ORDER_FILL_EXPIRED',
    'ORDER_CANCEL_EXPIRED',
    'ORDER_CANCEL_AMOUNT_ZERO',
    'ORDER_ALREADY_CANCELLED_OR_FILLED',
    'ORDER_REMAINING_FILL_AMOUNT_ZERO',
    'ORDER_FILL_ROUNDING_ERROR',
    'FILL_BALANCE_ALLOWANCE_ERROR',
    'INSUFFICIENT_TAKER_BALANCE',
    'INSUFFICIENT_TAKER_ALLOWANCE',
    'INSUFFICIENT_MAKER_BALANCE',
    'INSUFFICIENT_MAKER_ALLOWANCE',
    'INSUFFICIENT_TAKER_FEE_BALANCE',
    'INSUFFICIENT_TAKER_FEE_ALLOWANCE',
    'INSUFFICIENT_MAKER_FEE_BALANCE',
    'INSUFFICIENT_MAKER_FEE_ALLOWANCE',
    'TRANSACTION_SENDER_IS_NOT_FILL_ORDER_TAKER',

]);
export type ExchangeContractErrs = keyof typeof ExchangeContractErrs;

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

export type BlockParam = 'latest'|'earliest'|'pending'|number;

export interface SubscriptionOpts {
    fromBlock: BlockParam;
    toBlock: BlockParam;
}

export type DoneCallback = (err?: Error) => void;
