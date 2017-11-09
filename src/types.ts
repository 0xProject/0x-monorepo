import * as Web3 from 'web3';
import BigNumber from 'bignumber.js';

export enum ZeroExError {
    ContractDoesNotExist = 'CONTRACT_DOES_NOT_EXIST',
    ExchangeContractDoesNotExist = 'EXCHANGE_CONTRACT_DOES_NOT_EXIST',
    UnhandledError = 'UNHANDLED_ERROR',
    UserHasNoAssociatedAddress = 'USER_HAS_NO_ASSOCIATED_ADDRESSES',
    InvalidSignature = 'INVALID_SIGNATURE',
    ContractNotDeployedOnNetwork = 'CONTRACT_NOT_DEPLOYED_ON_NETWORK',
    InsufficientAllowanceForTransfer = 'INSUFFICIENT_ALLOWANCE_FOR_TRANSFER',
    InsufficientBalanceForTransfer = 'INSUFFICIENT_BALANCE_FOR_TRANSFER',
    InsufficientEthBalanceForDeposit = 'INSUFFICIENT_ETH_BALANCE_FOR_DEPOSIT',
    InsufficientWEthBalanceForWithdrawal = 'INSUFFICIENT_WETH_BALANCE_FOR_WITHDRAWAL',
    InvalidJump = 'INVALID_JUMP',
    OutOfGas = 'OUT_OF_GAS',
    NoNetworkId = 'NO_NETWORK_ID',
    SubscriptionNotFound = 'SUBSCRIPTION_NOT_FOUND',
}

export enum InternalZeroExError {
    NoAbiDecoder = 'NO_ABI_DECODER',
    ZrxNotInTokenRegistry = 'ZRX_NOT_IN_TOKEN_REGISTRY',
}

/**
 * Elliptic Curve signature
 */
export interface ECSignature {
    v: number;
    r: string;
    s: string;
}

export type OrderAddresses = [string, string, string, string, string];

export type OrderValues = [BigNumber, BigNumber, BigNumber,
                           BigNumber, BigNumber, BigNumber];

export type LogEvent = Web3.LogEntryEvent;
export type DecodedLogEvent<ArgsType> = Web3.DecodedLogEntryEvent<ArgsType>;

export type EventCallbackAsync<ArgsType> = (log: DecodedLogEvent<ArgsType>) => Promise<void>;
export type EventCallbackSync<ArgsType> = (log: DecodedLogEvent<ArgsType>) => void;
export type EventCallback<ArgsType> = EventCallbackSync<ArgsType>|EventCallbackAsync<ArgsType>;

export type MempoolEventCallbackSync = (log: LogEvent) => void;
export type MempoolEventCallbackAsync = (log: LogEvent) => Promise<void>;
export type MempoolEventCallback = MempoolEventCallbackSync|MempoolEventCallbackAsync;

export interface ExchangeContract extends Web3.ContractInstance {
    isValidSignature: {
        callAsync: (signerAddressHex: string, dataHex: string, v: number, r: string, s: string,
                    txOpts?: TxOpts) => Promise<boolean>;
    };
    ZRX_TOKEN_CONTRACT: {
        callAsync: () => Promise<string>;
    };
    TOKEN_TRANSFER_PROXY_CONTRACT: {
        callAsync: () => Promise<string>;
    };
    getUnavailableTakerTokenAmount: {
        callAsync: (orderHash: string, defaultBlock?: Web3.BlockParam) => Promise<BigNumber>;
    };
    isRoundingError: {
        callAsync: (takerTokenFillAmount: BigNumber, takerTokenAmount: BigNumber,
                    makerTokenAmount: BigNumber, txOpts?: TxOpts) => Promise<boolean>;
    };
    fillOrder: {
        sendTransactionAsync: (orderAddresses: OrderAddresses, orderValues: OrderValues,
                               fillTakerTokenAmount: BigNumber,
                               shouldThrowOnInsufficientBalanceOrAllowance: boolean,
                               v: number, r: string, s: string, txOpts?: TxOpts) => Promise<string>;
        estimateGasAsync: (orderAddresses: OrderAddresses, orderValues: OrderValues,
                           fillTakerTokenAmount: BigNumber,
                           shouldThrowOnInsufficientBalanceOrAllowance: boolean,
                           v: number, r: string, s: string, txOpts?: TxOpts) => Promise<number>;
    };
    batchFillOrders: {
        sendTransactionAsync: (orderAddresses: OrderAddresses[], orderValues: OrderValues[],
                               fillTakerTokenAmounts: BigNumber[],
                               shouldThrowOnInsufficientBalanceOrAllowance: boolean,
                               v: number[], r: string[], s: string[], txOpts?: TxOpts) => Promise<string>;
        estimateGasAsync: (orderAddresses: OrderAddresses[], orderValues: OrderValues[],
                           fillTakerTokenAmounts: BigNumber[],
                           shouldThrowOnInsufficientBalanceOrAllowance: boolean,
                           v: number[], r: string[], s: string[], txOpts?: TxOpts) => Promise<number>;
    };
    fillOrdersUpTo: {
        sendTransactionAsync: (orderAddresses: OrderAddresses[], orderValues: OrderValues[],
                               fillTakerTokenAmount: BigNumber,
                               shouldThrowOnInsufficientBalanceOrAllowance: boolean,
                               v: number[], r: string[], s: string[], txOpts?: TxOpts) => Promise<string>;
        estimateGasAsync: (orderAddresses: OrderAddresses[], orderValues: OrderValues[],
                           fillTakerTokenAmount: BigNumber,
                           shouldThrowOnInsufficientBalanceOrAllowance: boolean,
                           v: number[], r: string[], s: string[], txOpts?: TxOpts) => Promise<number>;
    };
    cancelOrder: {
        sendTransactionAsync: (orderAddresses: OrderAddresses, orderValues: OrderValues,
                               cancelTakerTokenAmount: BigNumber, txOpts?: TxOpts) => Promise<string>;
        estimateGasAsync: (orderAddresses: OrderAddresses, orderValues: OrderValues,
                           cancelTakerTokenAmount: BigNumber,
                           txOpts?: TxOpts) => Promise<number>;
    };
    batchCancelOrders: {
        sendTransactionAsync: (orderAddresses: OrderAddresses[], orderValues: OrderValues[],
                               cancelTakerTokenAmounts: BigNumber[], txOpts?: TxOpts) => Promise<string>;
        estimateGasAsync: (orderAddresses: OrderAddresses[], orderValues: OrderValues[],
                           cancelTakerTokenAmounts: BigNumber[],
                           txOpts?: TxOpts) => Promise<number>;
    };
    fillOrKillOrder: {
        sendTransactionAsync: (orderAddresses: OrderAddresses, orderValues: OrderValues,
                               fillTakerTokenAmount: BigNumber,
                               v: number, r: string, s: string, txOpts?: TxOpts) => Promise<string>;
        estimateGasAsync: (orderAddresses: OrderAddresses, orderValues: OrderValues,
                           fillTakerTokenAmount: BigNumber,
                           v: number, r: string, s: string, txOpts?: TxOpts) => Promise<number>;
    };
    batchFillOrKillOrders: {
        sendTransactionAsync: (orderAddresses: OrderAddresses[], orderValues: OrderValues[],
                               fillTakerTokenAmounts: BigNumber[],
                               v: number[], r: string[], s: string[], txOpts: TxOpts) => Promise<string>;
        estimateGasAsync: (orderAddresses: OrderAddresses[], orderValues: OrderValues[],
                           fillTakerTokenAmounts: BigNumber[],
                           v: number[], r: string[], s: string[], txOpts?: TxOpts) => Promise<number>;
    };
    filled: {
        callAsync: (orderHash: string, defaultBlock?: Web3.BlockParam) => Promise<BigNumber>;
    };
    cancelled: {
        callAsync: (orderHash: string, defaultBlock?: Web3.BlockParam) => Promise<BigNumber>;
    };
    getOrderHash: {
        callAsync: (orderAddresses: OrderAddresses, orderValues: OrderValues) => Promise<string>;
    };
}

export interface TokenContract extends Web3.ContractInstance {
    balanceOf: {
        callAsync: (address: string, defaultBlock?: Web3.BlockParam) => Promise<BigNumber>;
    };
    allowance: {
        callAsync: (ownerAddress: string, allowedAddress: string,
                    defaultBlock?: Web3.BlockParam) => Promise<BigNumber>;
    };
    transfer: {
        sendTransactionAsync: (toAddress: string, amountInBaseUnits: BigNumber,
                               txOpts?: TxOpts) => Promise<string>;
    };
    transferFrom: {
        sendTransactionAsync: (fromAddress: string, toAddress: string, amountInBaseUnits: BigNumber,
                               txOpts?: TxOpts) => Promise<string>;
    };
    approve: {
        sendTransactionAsync: (proxyAddress: string, amountInBaseUnits: BigNumber,
                               txOpts?: TxOpts) => Promise<string>;
    };
}

export interface TokenRegistryContract extends Web3.ContractInstance {
    getTokenMetaData: {
        callAsync: (address: string) => Promise<TokenMetadata>;
    };
    getTokenAddresses: {
        callAsync: () => Promise<string[]>;
    };
    getTokenAddressBySymbol: {
        callAsync: (symbol: string) => Promise<string>;
    };
    getTokenAddressByName: {
        callAsync: (name: string) => Promise<string>;
    };
    getTokenBySymbol: {
        callAsync: (symbol: string) => Promise<TokenMetadata>;
    };
    getTokenByName: {
        callAsync: (name: string) => Promise<TokenMetadata>;
    };
}

export interface EtherTokenContract extends Web3.ContractInstance {
    deposit: {
        sendTransactionAsync: (txOpts: TxOpts) => Promise<string>;
    };
    withdraw: {
        sendTransactionAsync: (amount: BigNumber, txOpts: TxOpts) => Promise<string>;
    };
}

export interface TokenTransferProxyContract extends Web3.ContractInstance {
    getAuthorizedAddresses: {
        callAsync: () => Promise<string[]>;
    };
    authorized: {
        callAsync: (address: string) => Promise<boolean>;
    };
}

export enum SolidityTypes {
    Address = 'address',
    Uint256 = 'uint256',
    Uint8 = 'uint8',
    Uint = 'uint',
}

export enum ExchangeContractErrCodes {
    ERROR_FILL_EXPIRED, // Order has already expired
    ERROR_FILL_NO_VALUE, // Order has already been fully filled or cancelled
    ERROR_FILL_TRUNCATION, // Rounding error too large
    ERROR_FILL_BALANCE_ALLOWANCE, // Insufficient balance or allowance for token transfer
    ERROR_CANCEL_EXPIRED, // Order has already expired
    ERROR_CANCEL_NO_VALUE, // Order has already been fully filled or cancelled
}

export enum ExchangeContractErrs {
    OrderFillExpired = 'ORDER_FILL_EXPIRED',
    OrderCancelExpired = 'ORDER_CANCEL_EXPIRED',
    OrderCancelAmountZero = 'ORDER_CANCEL_AMOUNT_ZERO',
    OrderAlreadyCancelledOrFilled = 'ORDER_ALREADY_CANCELLED_OR_FILLED',
    OrderFillAmountZero = 'ORDER_FILL_AMOUNT_ZERO',
    OrderRemainingFillAmountZero = 'ORDER_REMAINING_FILL_AMOUNT_ZERO',
    OrderFillRoundingError = 'ORDER_FILL_ROUNDING_ERROR',
    FillBalanceAllowanceError = 'FILL_BALANCE_ALLOWANCE_ERROR',
    InsufficientTakerBalance = 'INSUFFICIENT_TAKER_BALANCE',
    InsufficientTakerAllowance = 'INSUFFICIENT_TAKER_ALLOWANCE',
    InsufficientMakerBalance = 'INSUFFICIENT_MAKER_BALANCE',
    InsufficientMakerAllowance = 'INSUFFICIENT_MAKER_ALLOWANCE',
    InsufficientTakerFeeBalance = 'INSUFFICIENT_TAKER_FEE_BALANCE',
    InsufficientTakerFeeAllowance = 'INSUFFICIENT_TAKER_FEE_ALLOWANCE',
    InsufficientMakerFeeBalance = 'INSUFFICIENT_MAKER_FEE_BALANCE',
    InsufficientMakerFeeAllowance = 'INSUFFICIENT_MAKER_FEE_ALLOWANCE',
    TransactionSenderIsNotFillOrderTaker = 'TRANSACTION_SENDER_IS_NOT_FILL_ORDER_TAKER',
    MultipleMakersInSingleCancelBatchDisallowed = 'MULTIPLE_MAKERS_IN_SINGLE_CANCEL_BATCH_DISALLOWED',
    InsufficientRemainingFillAmount = 'INSUFFICIENT_REMAINING_FILL_AMOUNT',
    MultipleTakerTokensInFillUpToDisallowed = 'MULTIPLE_TAKER_TOKENS_IN_FILL_UP_TO_DISALLOWED',
    BatchOrdersMustHaveSameExchangeAddress = 'BATCH_ORDERS_MUST_HAVE_SAME_EXCHANGE_ADDRESS',
    BatchOrdersMustHaveAtLeastOneItem = 'BATCH_ORDERS_MUST_HAVE_AT_LEAST_ONE_ITEM',
}

export type RawLog = Web3.LogEntry;

export interface ContractEvent {
    logIndex: number;
    transactionIndex: number;
    transactionHash: string;
    blockHash: string;
    blockNumber: number;
    address: string;
    type: string;
    event: string;
    args: ContractEventArgs;
}

export interface LogFillContractEventArgs {
    maker: string;
    taker: string;
    feeRecipient: string;
    makerToken: string;
    takerToken: string;
    filledMakerTokenAmount: BigNumber;
    filledTakerTokenAmount: BigNumber;
    paidMakerFee: BigNumber;
    paidTakerFee: BigNumber;
    tokens: string;
    orderHash: string;
}
export interface LogCancelContractEventArgs {
    maker: string;
    feeRecipient: string;
    makerToken: string;
    takerToken: string;
    cancelledMakerTokenAmount: BigNumber;
    cancelledTakerTokenAmount: BigNumber;
    tokens: string;
    orderHash: string;
}
export interface LogErrorContractEventArgs {
    errorId: BigNumber;
    orderHash: string;
}
export type ExchangeContractEventArgs = LogFillContractEventArgs|LogCancelContractEventArgs|LogErrorContractEventArgs;
export interface TransferContractEventArgs {
    _from: string;
    _to: string;
    _value: BigNumber;
}
export interface ApprovalContractEventArgs {
    _owner: string;
    _spender: string;
    _value: BigNumber;
}
export type TokenContractEventArgs = TransferContractEventArgs|ApprovalContractEventArgs;
export type ContractEventArgs = ExchangeContractEventArgs|TokenContractEventArgs;
export type ContractEventArg = string|BigNumber;

export interface Order {
    maker: string;
    taker: string;
    makerFee: BigNumber;
    takerFee: BigNumber;
    makerTokenAmount: BigNumber;
    takerTokenAmount: BigNumber;
    makerTokenAddress: string;
    takerTokenAddress: string;
    salt: BigNumber;
    exchangeContractAddress: string;
    feeRecipient: string;
    expirationUnixTimestampSec: BigNumber;
}

export interface SignedOrder extends Order {
    ecSignature: ECSignature;
}

//                          [address, name, symbol, decimals, ipfsHash, swarmHash]
export type TokenMetadata = [string, string, string, BigNumber, string, string];

export interface Token {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
}

export interface TxOpts {
    from: string;
    gas?: number;
    value?: BigNumber;
}

export interface TokenAddressBySymbol {
    [symbol: string]: string;
}

export enum ExchangeEvents {
    LogFill = 'LogFill',
    LogCancel = 'LogCancel',
    LogError = 'LogError',
}

export enum TokenEvents {
    Transfer = 'Transfer',
    Approval = 'Approval',
}

export type ContractEvents = TokenEvents|ExchangeEvents;

export interface IndexedFilterValues {
    [index: string]: ContractEventArg;
}

export enum BlockParamLiteral {
    Latest = 'latest',
    Earliest = 'earliest',
    Pending = 'pending',
}

export type BlockParam = BlockParamLiteral|number;

export interface SubscriptionOpts {
    fromBlock: BlockParam;
    toBlock: BlockParam;
}

export type DoneCallback = (err?: Error) => void;

export interface OrderCancellationRequest {
    order: Order|SignedOrder;
    takerTokenCancelAmount: BigNumber;
}

export interface OrderFillRequest {
    signedOrder: SignedOrder;
    takerTokenFillAmount: BigNumber;
}

export type AsyncMethod = (...args: any[]) => Promise<any>;

/**
 * We re-export the `Web3.Provider` type specified in the Web3 Typescript typings
 * since it is the type of the `provider` argument to the `ZeroEx` constructor.
 * It is however a `Web3` library type, not a native `0x.js` type.
 */
export type Web3Provider = Web3.Provider;

export interface ExchangeContractByAddress {
    [address: string]: ExchangeContract;
}

export interface JSONRPCPayload {
    params: any[];
    method: string;
}

/*
 * gasPrice: Gas price to use with every transaction
 * exchangeContractAddress: The address of an exchange contract to use
 * tokenRegistryContractAddress: The address of a token registry contract to use
 * etherTokenContractAddress: The address of an ether token contract to use
 */
export interface ZeroExConfig {
    gasPrice?: BigNumber; // Gas price to use with every transaction
    exchangeContractAddress?: string;
    tokenRegistryContractAddress?: string;
    etherTokenContractAddress?: string;
}

/*
 * mempoolPollingIntervalMs: How often to check for new mempool events
 */
export interface OrderWatcherConfig {
    mempoolPollingIntervalMs?: number;
}

export type TransactionReceipt = Web3.TransactionReceipt;

export enum AbiType {
    Function = 'function',
    Constructor = 'constructor',
    Event = 'event',
    Fallback = 'fallback',
}

export interface DecodedLogArgs {
    [argName: string]: ContractEventArg;
}

export interface LogWithDecodedArgs<ArgsType> extends Web3.DecodedLogEntry<ArgsType> {}

export interface TransactionReceiptWithDecodedLogs extends Web3.TransactionReceipt {
    logs: Array<LogWithDecodedArgs<DecodedLogArgs>|Web3.LogEntry>;
}

export interface Artifact {
    abi: any;
    networks: {[networkId: number]: {
        address: string;
    }};
}

/*
 * expectedFillTakerTokenAmount: If specified, the validation method will ensure that the
 * supplied order maker has a sufficient allowance/balance to fill this amount of the order's
 * takerTokenAmount. If not specified, the validation method ensures that the maker has a sufficient
 * allowance/balance to fill the entire remaining order amount.
 */
export interface ValidateOrderFillableOpts {
    expectedFillTakerTokenAmount?: BigNumber;
}

/*
 * defaultBlock: The block up to which to query the blockchain state. Setting this to a historical block number
 * let's the user query the blockchain's state at an arbitrary point in time. In order for this to work, the
 * backing  Ethereum node must keep the entire historical state of the chain (e.g setting `--pruning=archive`
 * flag when  running Parity).
 */
export interface MethodOpts {
    defaultBlock?: Web3.BlockParam;
}

/*
 * shouldValidate: Flag indicating whether the library should make attempts to validate a transaction before
 * broadcasting it. For example, order has a valid signature, maker has sufficient funds, etc.
 */
export interface OrderTransactionOpts {
    shouldValidate: boolean;
}

export type FilterObject = Web3.FilterObject;

export enum TradeSide {
    Maker = 'maker',
    Taker = 'taker',
}

export enum TransferType {
    Trade = 'trade',
    Fee = 'fee',
}

export interface OrderStateValid {
    isValid: true;
    orderHash: string;
    makerBalance: BigNumber;
    makerAllowance: BigNumber;
    makerFeeBalance: BigNumber;
    makerFeeAllowance: BigNumber;
    filledMakerTokenAmount: BigNumber;
    cancelledMakerTokenAmount: BigNumber;
}

export interface OrderStateInvalid {
    isValid: false;
    orderHash: string;
    error: ExchangeContractErrs;
}

export type OnOrderStateChangeCallback = (
    orderState: OrderStateValid|OrderStateInvalid,
) => void;
