import { TransactionReceipt } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as Web3 from 'web3';

export enum ZeroExError {
    ExchangeContractDoesNotExist = 'EXCHANGE_CONTRACT_DOES_NOT_EXIST',
    ZRXContractDoesNotExist = 'ZRX_CONTRACT_DOES_NOT_EXIST',
    EtherTokenContractDoesNotExist = 'ETHER_TOKEN_CONTRACT_DOES_NOT_EXIST',
    TokenTransferProxyContractDoesNotExist = 'TOKEN_TRANSFER_PROXY_CONTRACT_DOES_NOT_EXIST',
    TokenRegistryContractDoesNotExist = 'TOKEN_REGISTRY_CONTRACT_DOES_NOT_EXIST',
    TokenContractDoesNotExist = 'TOKEN_CONTRACT_DOES_NOT_EXIST',
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
    SubscriptionAlreadyPresent = 'SUBSCRIPTION_ALREADY_PRESENT',
    TransactionMiningTimeout = 'TRANSACTION_MINING_TIMEOUT',
}

export enum InternalZeroExError {
    NoAbiDecoder = 'NO_ABI_DECODER',
    ZrxNotInTokenRegistry = 'ZRX_NOT_IN_TOKEN_REGISTRY',
    WethNotInTokenRegistry = 'WETH_NOT_IN_TOKEN_REGISTRY',
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

export type OrderValues = [BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber];

export type LogEvent = Web3.LogEntryEvent;
export interface DecodedLogEvent<ArgsType> {
    isRemoved: boolean;
    log: LogWithDecodedArgs<ArgsType>;
}

export type EventCallback<ArgsType> = (err: null | Error, log?: DecodedLogEvent<ArgsType>) => void;
export type EventWatcherCallback = (log: LogEvent) => void;

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
export type ExchangeContractEventArgs =
    | LogFillContractEventArgs
    | LogCancelContractEventArgs
    | LogErrorContractEventArgs;
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
export interface DepositContractEventArgs {
    _owner: string;
    _value: BigNumber;
}
export interface WithdrawalContractEventArgs {
    _owner: string;
    _value: BigNumber;
}
export type TokenContractEventArgs = TransferContractEventArgs | ApprovalContractEventArgs;
export type EtherTokenContractEventArgs =
    | TokenContractEventArgs
    | DepositContractEventArgs
    | WithdrawalContractEventArgs;
export type ContractEventArgs = ExchangeContractEventArgs | TokenContractEventArgs | EtherTokenContractEventArgs;
export type ContractEventArg = string | BigNumber;

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
    gasPrice?: BigNumber;
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

export enum EtherTokenEvents {
    Transfer = 'Transfer',
    Approval = 'Approval',
    Deposit = 'Deposit',
    Withdrawal = 'Withdrawal',
}

export type ContractEvents = TokenEvents | ExchangeEvents | EtherTokenEvents;

export interface IndexedFilterValues {
    [index: string]: ContractEventArg;
}

// Earliest is omitted by design. It is simply an alias for the `0` constant and
// is thus not very helpful. Moreover, this type is used in places that only accept
// `latest` or `pending`.
export enum BlockParamLiteral {
    Latest = 'latest',
    Pending = 'pending',
}

export type BlockParam = BlockParamLiteral | number;

export interface BlockRange {
    fromBlock: BlockParam;
    toBlock: BlockParam;
}

export type DoneCallback = (err?: Error) => void;

export interface OrderCancellationRequest {
    order: Order | SignedOrder;
    takerTokenCancelAmount: BigNumber;
}

export interface OrderFillRequest {
    signedOrder: SignedOrder;
    takerTokenFillAmount: BigNumber;
}

export type AsyncMethod = (...args: any[]) => Promise<any>;
export type SyncMethod = (...args: any[]) => any;

/**
 * We re-export the `Web3.Provider` type specified in the Web3 Typescript typings
 * since it is the type of the `provider` argument to the `ZeroEx` constructor.
 * It is however a `Web3` library type, not a native `0x.js` type. To learn more
 * about providers, visit https://0xproject.com/wiki#Web3-Provider-Explained
 */
export type Web3Provider = Web3.Provider;

export interface JSONRPCPayload {
    params: any[];
    method: string;
}

/*
 * orderExpirationCheckingIntervalMs: How often to check for expired orders. Default: 50
 * eventPollingIntervalMs: How often to poll the Ethereum node for new events. Defaults: 200
 * expirationMarginMs: Amount of time before order expiry that you'd like to be notified
 * of an orders expiration. Defaults: 0
 * cleanupJobIntervalMs: How often to run a cleanup job which revalidates all the orders. Defaults: 1h
 */
export interface OrderStateWatcherConfig {
    orderExpirationCheckingIntervalMs?: number;
    eventPollingIntervalMs?: number;
    expirationMarginMs?: number;
    cleanupJobIntervalMs?: number;
}

/*
 * networkId: The id of the underlying ethereum network your provider is connected to. (1-mainnet, 42-kovan, 50-testrpc)
 * gasPrice: Gas price to use with every transaction
 * exchangeContractAddress: The address of an exchange contract to use
 * tokenRegistryContractAddress: The address of a token registry contract to use
 * tokenTransferProxyContractAddress: The address of the token transfer proxy contract to use
 * orderWatcherConfig: All the configs related to the orderWatcher
 */
export interface ZeroExConfig {
    networkId: number;
    gasPrice?: BigNumber;
    exchangeContractAddress?: string;
    tokenRegistryContractAddress?: string;
    tokenTransferProxyContractAddress?: string;
    orderWatcherConfig?: OrderStateWatcherConfig;
}

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

export interface TransactionReceiptWithDecodedLogs extends TransactionReceipt {
    logs: Array<LogWithDecodedArgs<DecodedLogArgs> | Web3.LogEntry>;
}

export type ArtifactContractName = 'ZRX' | 'TokenTransferProxy' | 'TokenRegistry' | 'Token' | 'Exchange' | 'EtherToken';

export interface Artifact {
    contract_name: ArtifactContractName;
    abi: Web3.ContractAbi;
    networks: {
        [networkId: number]: {
            address: string;
        };
    };
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
 * gasPrice: Gas price in Wei to use for a transaction
 * gasLimit: The amount of gas to send with a transaction
 */
export interface TransactionOpts {
    gasPrice?: BigNumber;
    gasLimit?: number;
}

/*
 * shouldValidate: Flag indicating whether the library should make attempts to validate a transaction before
 * broadcasting it. For example, order has a valid signature, maker has sufficient funds, etc. Default: true
 */
export interface OrderTransactionOpts extends TransactionOpts {
    shouldValidate?: boolean;
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

export interface OrderRelevantState {
    makerBalance: BigNumber;
    makerProxyAllowance: BigNumber;
    makerFeeBalance: BigNumber;
    makerFeeProxyAllowance: BigNumber;
    filledTakerTokenAmount: BigNumber;
    cancelledTakerTokenAmount: BigNumber;
    remainingFillableMakerTokenAmount: BigNumber;
    remainingFillableTakerTokenAmount: BigNumber;
}

export interface OrderStateValid {
    isValid: true;
    orderHash: string;
    orderRelevantState: OrderRelevantState;
}

export interface OrderStateInvalid {
    isValid: false;
    orderHash: string;
    error: ExchangeContractErrs;
}

export type OrderState = OrderStateValid | OrderStateInvalid;

export type OnOrderStateChangeCallback = (orderState: OrderState) => void;
// tslint:disable:max-file-line-count
