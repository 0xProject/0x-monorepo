import { ContractAddresses } from '@0x/contract-addresses';
import { BigNumber } from '@0x/utils';

export interface TxOpts {
    from: string;
    gas?: number;
    value?: BigNumber;
    gasPrice?: BigNumber;
}

export enum ForwarderError {
    CompleteFillFailed = 'COMPLETE_FILL_FAILED',
}

export enum ContractError {
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

export { CoordinatorServerCancellationResponse, CoordinatorServerError } from './utils/coordinator_server_types';

export interface CoordinatorTransaction {
    salt: BigNumber;
    signerAddress: string;
    data: string;
}
