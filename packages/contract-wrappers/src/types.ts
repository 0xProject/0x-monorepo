import {
    ERC20TokenEventArgs,
    ERC20TokenEvents,
    ERC721TokenEventArgs,
    ERC721TokenEvents,
    ExchangeEventArgs,
    ExchangeEvents,
    WETH9EventArgs,
    WETH9Events,
} from '@0xproject/abi-gen-wrappers';
import { ContractAddresses, OrderState, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

import { BlockParam, ContractEventArg, DecodedLogArgs, LogEntryEvent, LogWithDecodedArgs } from 'ethereum-types';

export enum ExchangeWrapperError {
    AssetDataMismatch = 'ASSET_DATA_MISMATCH',
}

export enum ContractWrappersError {
    ExchangeContractDoesNotExist = 'EXCHANGE_CONTRACT_DOES_NOT_EXIST',
    ZRXContractDoesNotExist = 'ZRX_CONTRACT_DOES_NOT_EXIST',
    EtherTokenContractDoesNotExist = 'ETHER_TOKEN_CONTRACT_DOES_NOT_EXIST',
    ERC20ProxyContractDoesNotExist = 'ERC20_PROXY_CONTRACT_DOES_NOT_EXIST',
    ERC721ProxyContractDoesNotExist = 'ERC721_PROXY_CONTRACT_DOES_NOT_EXIST',
    ERC20TokenContractDoesNotExist = 'ERC20_TOKEN_CONTRACT_DOES_NOT_EXIST',
    ERC721TokenContractDoesNotExist = 'ERC721_TOKEN_CONTRACT_DOES_NOT_EXIST',
    ContractNotDeployedOnNetwork = 'CONTRACT_NOT_DEPLOYED_ON_NETWORK',
    InsufficientAllowanceForTransfer = 'INSUFFICIENT_ALLOWANCE_FOR_TRANSFER',
    InsufficientBalanceForTransfer = 'INSUFFICIENT_BALANCE_FOR_TRANSFER',
    InsufficientEthBalanceForDeposit = 'INSUFFICIENT_ETH_BALANCE_FOR_DEPOSIT',
    InsufficientWEthBalanceForWithdrawal = 'INSUFFICIENT_WETH_BALANCE_FOR_WITHDRAWAL',
    InvalidJump = 'INVALID_JUMP',
    OutOfGas = 'OUT_OF_GAS',
    SubscriptionNotFound = 'SUBSCRIPTION_NOT_FOUND',
    SubscriptionAlreadyPresent = 'SUBSCRIPTION_ALREADY_PRESENT',
    ERC721OwnerNotFound = 'ERC_721_OWNER_NOT_FOUND',
    ERC721NoApproval = 'ERC_721_NO_APPROVAL',
}

export enum InternalContractWrappersError {
    NoAbiDecoder = 'NO_ABI_DECODER',
}

export type LogEvent = LogEntryEvent;
export interface DecodedLogEvent<ArgsType extends DecodedLogArgs> {
    isRemoved: boolean;
    log: LogWithDecodedArgs<ArgsType>;
}

export type EventCallback<ArgsType extends DecodedLogArgs> = (
    err: null | Error,
    log?: DecodedLogEvent<ArgsType>,
) => void;

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

export type ContractEventArgs = ExchangeEventArgs | ERC20TokenEventArgs | ERC721TokenEventArgs | WETH9EventArgs;

//                          [address, name, symbol, decimals, ipfsHash, swarmHash]
export type TokenMetadata = [string, string, string, number, string, string];

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

export type ContractEvents = ERC20TokenEvents | ERC721TokenEvents | ExchangeEvents | WETH9Events;

export interface IndexedFilterValues {
    [index: string]: ContractEventArg;
}

export interface BlockRange {
    fromBlock: BlockParam;
    toBlock: BlockParam;
}

export interface OrderFillRequest {
    signedOrder: SignedOrder;
    takerAssetFillAmount: BigNumber;
}

export type AsyncMethod = (...args: any[]) => Promise<any>;
export type SyncMethod = (...args: any[]) => any;

/**
 * networkId: The id of the underlying ethereum network your provider is connected to. (1-mainnet, 3-ropsten, 4-rinkeby, 42-kovan, 50-testrpc)
 * gasPrice: Gas price to use with every transaction
 * exchangeContractAddress: The address of an exchange contract to use
 * zrxContractAddress: The address of the ZRX contract to use
 * erc20ProxyContractAddress: The address of the erc20 token transfer proxy contract to use
 * erc721ProxyContractAddress: The address of the erc721 token transfer proxy contract to use
 * forwarderContractAddress: The address of the forwarder contract to use
 * orderWatcherConfig: All the configs related to the orderWatcher
 * blockPollingIntervalMs: The interval to use for block polling in event watching methods (defaults to 1000)
 */
export interface ContractWrappersConfig {
    networkId: number;
    gasPrice?: BigNumber;
    contractAddresses: ContractAddresses;
    blockPollingIntervalMs?: number;
}

/**
 * expectedFillTakerTokenAmount: If specified, the validation method will ensure that the
 * supplied order maker has a sufficient allowance/balance to fill this amount of the order's
 * takerTokenAmount. If not specified, the validation method ensures that the maker has a sufficient
 * allowance/balance to fill the entire remaining order amount.
 */
export interface ValidateOrderFillableOpts {
    expectedFillTakerTokenAmount?: BigNumber;
}

/**
 * defaultBlock: The block up to which to query the blockchain state. Setting this to a historical block number
 * let's the user query the blockchain's state at an arbitrary point in time. In order for this to work, the
 * backing  Ethereum node must keep the entire historical state of the chain (e.g setting `--pruning=archive`
 * flag when  running Parity).
 */
export interface MethodOpts {
    defaultBlock?: BlockParam;
}

/**
 * gasPrice: Gas price in Wei to use for a transaction
 * gasLimit: The amount of gas to send with a transaction (in Gwei)
 */
export interface TransactionOpts {
    gasPrice?: BigNumber;
    gasLimit?: number;
}

/**
 * shouldValidate: Flag indicating whether the library should make attempts to validate a transaction before
 * broadcasting it. For example, order has a valid signature, maker has sufficient funds, etc. Default=true.
 */
export interface OrderTransactionOpts extends TransactionOpts {
    shouldValidate?: boolean;
}

export enum TradeSide {
    Maker = 'maker',
    Taker = 'taker',
}

export enum TransferType {
    Trade = 'trade',
    Fee = 'fee',
}

export type OnOrderStateChangeCallback = (err: Error | null, orderState?: OrderState) => void;

export interface OrderInfo {
    orderStatus: OrderStatus;
    orderHash: string;
    orderTakerAssetFilledAmount: BigNumber;
}

export enum OrderStatus {
    INVALID = 0,
    INVALID_MAKER_ASSET_AMOUNT,
    INVALID_TAKER_ASSET_AMOUNT,
    FILLABLE,
    EXPIRED,
    FULLY_FILLED,
    CANCELLED,
}

export interface TraderInfo {
    makerBalance: BigNumber;
    makerAllowance: BigNumber;
    takerBalance: BigNumber;
    takerAllowance: BigNumber;
    makerZrxBalance: BigNumber;
    makerZrxAllowance: BigNumber;
    takerZrxBalance: BigNumber;
    takerZrxAllowance: BigNumber;
}

export interface OrderAndTraderInfo {
    orderInfo: OrderInfo;
    traderInfo: TraderInfo;
}

export interface BalanceAndAllowance {
    balance: BigNumber;
    allowance: BigNumber;
}
