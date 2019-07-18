import { ContractAddresses } from '@0x/contract-addresses';
import { OrderState, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { BlockParam, ContractEventArg, DecodedLogArgs, LogEntryEvent, LogWithDecodedArgs } from 'ethereum-types';

export enum ExchangeWrapperError {
    AssetDataMismatch = 'ASSET_DATA_MISMATCH',
}

export enum ForwarderWrapperError {
    CompleteFillFailed = 'COMPLETE_FILL_FAILED',
}

export enum ContractWrappersError {
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
    SignatureRequestDenied = 'SIGNATURE_REQUEST_DENIED',
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

export interface ContractEvent<ContractEventArgs> {
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
 * `expectedFillTakerTokenAmount`: If specified, the validation method will ensure that the supplied order maker has a sufficient
 *                               allowance/balance to fill this amount of the order's takerTokenAmount.
 *
 * `validateRemainingOrderAmountIsFillable`: The validation method ensures that the maker has sufficient allowance/balance to fill
 *                                         the entire remaining order amount. If this option is set to false, the balances
 *                                         and allowances are calculated to determine the order is fillable for a
 *                                         non-zero amount (some value less than or equal to the order remaining amount).
 *                                         We call such orders "partially fillable orders". Default is `true`.
 *
 * `simulationTakerAddress`: During the maker transfer simulation, tokens are sent from the maker to the `simulationTakerAddress`. This defaults
 *                           to the `takerAddress` specified in the order. Some tokens prevent transfer to the NULL address so this address can be specified.
 */
export interface ValidateOrderFillableOpts {
    expectedFillTakerTokenAmount?: BigNumber;
    validateRemainingOrderAmountIsFillable?: boolean;
    simulationTakerAddress?: string;
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
    Invalid = 0,
    InvalidMakerAssetAmount,
    InvalidTakerAssetAmount,
    Fillable,
    Expired,
    FullyFilled,
    Cancelled,
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

export enum DutchAuctionWrapperError {
    AssetDataMismatch = 'ASSET_DATA_MISMATCH',
}

export interface CoordinatorTransaction {
    salt: BigNumber;
    signerAddress: string;
    data: string;
}
